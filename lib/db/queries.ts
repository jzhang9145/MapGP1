import 'server-only';

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  lte,
  type SQL,
  or,
  ilike,
} from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import {
  user,
  chat,
  type User,
  document,
  type Suggestion,
  suggestion,
  message,
  vote,
  type DBMessage,
  type Chat,
  stream,
  area,
  geojsonData,
  nycNeighborhoods,
  type NYCNeighborhood,
  plutoLots,
  type PlutoLot,
} from './schema';
import type { ArtifactKind } from '@/components/artifact';
import { generateUUID } from '../utils';
import { generateHashedPassword } from './utils';
import type { VisibilityType } from '@/components/visibility-selector';
import { ChatSDKError } from '../errors';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get user by email',
    );
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);

  try {
    return await db.insert(user).values({ email, password: hashedPassword });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to create user');
  }
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());

  try {
    return await db.insert(user).values({ email, password }).returning({
      id: user.id,
      email: user.email,
    });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create guest user',
    );
  }
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
      visibility,
    });
  } catch (error) {
    console.error(error);
    throw new ChatSDKError('bad_request:database', 'Failed to save chat');
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));
    await db.delete(stream).where(eq(stream.chatId, id));

    const [chatsDeleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();
    return chatsDeleted;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete chat by id',
    );
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const extendedLimit = limit + 1;

    const query = (whereCondition?: SQL<any>) =>
      db
        .select()
        .from(chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(chat.userId, id))
            : eq(chat.userId, id),
        )
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Array<Chat> = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${startingAfter} not found`,
        );
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${endingBefore} not found`,
        );
      }

      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
    } else {
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get chats by user id',
    );
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get chat by id');
  }
}

export async function saveMessages({
  messages,
}: {
  messages: Array<DBMessage>;
}) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save messages');
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get messages by chat id',
    );
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to vote message');
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get votes by chat id',
    );
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db
      .insert(document)
      .values({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date(),
      })
      .returning();
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save document');
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get documents by id',
    );
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get document by id',
    );
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete documents by id after timestamp',
    );
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to save suggestions',
    );
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get suggestions by document id',
    );
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message by id',
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );

    const messageIds = messagesToDelete.map((message) => message.id);

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds)),
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
        );
    }
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete messages by chat id after timestamp',
    );
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update chat visibility by id',
    );
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: { id: string; differenceInHours: number }) {
  try {
    const twentyFourHoursAgo = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000,
    );

    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          gte(message.createdAt, twentyFourHoursAgo),
          eq(message.role, 'user'),
        ),
      )
      .execute();

    return stats?.count ?? 0;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message count by user id',
    );
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    await db
      .insert(stream)
      .values({ id: streamId, chatId, createdAt: new Date() });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create stream id',
    );
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const streamIds = await db
      .select({ id: stream.id })
      .from(stream)
      .where(eq(stream.chatId, chatId))
      .orderBy(asc(stream.createdAt))
      .execute();

    return streamIds.map(({ id }) => id);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get stream ids by chat id',
    );
  }
}

export async function getAreaByChatId({ chatId }: { chatId: string }) {
  try {
    const [selectedArea] = await db
      .select({
        chatId: area.chatId,
        name: area.name,
        summary: area.summary,
        geojsonDataId: area.geojsonDataId,
        createdAt: area.createdAt,
        updatedAt: area.updatedAt,
        geojsonData: {
          id: geojsonData.id,
          data: geojsonData.data,
          metadata: geojsonData.metadata,
          createdAt: geojsonData.createdAt,
          updatedAt: geojsonData.updatedAt,
        },
      })
      .from(area)
      .leftJoin(geojsonData, eq(area.geojsonDataId, geojsonData.id))
      .where(eq(area.chatId, chatId));

    if (!selectedArea) return null;

    return {
      chatId: selectedArea.chatId,
      name: selectedArea.name,
      summary: selectedArea.summary,
      geojson: selectedArea.geojsonData?.data || null,
      geojsonDataId: selectedArea.geojsonDataId,
      createdAt: selectedArea.createdAt,
      updatedAt: selectedArea.updatedAt,
    };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get area by chat ID',
    );
  }
}

export async function createGeoJSONData({
  data,
  metadata,
}: {
  data: any;
  metadata: any;
}) {
  try {
    console.log('Creating GeoJSON data with:', { data: typeof data, metadata });

    // Validate that data is not null or undefined
    if (data === null || data === undefined) {
      throw new Error('GeoJSON data cannot be null or undefined');
    }

    // Ensure metadata is an object
    const safeMetadata =
      typeof metadata === 'object' ? metadata : { raw: metadata };

    const result = await db
      .insert(geojsonData)
      .values({
        data,
        metadata: safeMetadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log('Successfully created GeoJSON data:', result[0]?.id);
    return result;
  } catch (error) {
    console.error('Error creating GeoJSON data:', error);
    throw new ChatSDKError(
      'bad_request:database',
      `Failed to create GeoJSON data: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

export async function updateGeoJSONData({
  id,
  data,
  metadata,
}: {
  id: string;
  data: any;
  metadata: any;
}) {
  try {
    return await db
      .update(geojsonData)
      .set({
        data,
        metadata,
        updatedAt: new Date(),
      })
      .where(eq(geojsonData.id, id))
      .returning();
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update GeoJSON data',
    );
  }
}

export async function createArea({
  chatId,
  name,
  summary,
  geojsonDataId,
}: {
  chatId: string;
  name: string;
  summary: string;
  geojsonDataId: any;
}) {
  try {
    // Then create Area with reference to GeoJSONData
    return await db
      .insert(area)
      .values({
        chatId,
        name,
        summary,
        geojsonDataId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to create area');
  }
}

export async function updateArea({
  chatId,
  name,
  summary,
  geojsonDataId,
}: {
  chatId: string;
  name: string;
  summary: string;
  geojsonDataId: string;
}) {
  try {
    console.log('Updating area with:', {
      chatId,
      name,
      summary,
      geojsonDataId,
    });
    // Update Area
    return await db
      .update(area)
      .set({
        name,
        summary,
        geojsonDataId,
        updatedAt: new Date(),
      })
      .where(eq(area.chatId, chatId))
      .returning();
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to update area');
  }
}

export async function getGeoJSONDataById({ id }: { id: string }) {
  try {
    return await db.select().from(geojsonData).where(eq(geojsonData.id, id));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get GeoJSON data by ID',
    );
  }
}

// NYC Neighborhoods queries
export async function createNYCNeighborhood({
  name,
  borough,
  nta_code,
  nta_name,
  nta_2020,
  cdtca,
  cdtca_name,
  center_latitude,
  center_longitude,
  shape_area,
  shape_leng,
  geojsonDataId,
}: {
  name: string;
  borough: string;
  nta_code: string;
  nta_name: string;
  nta_2020: string;
  cdtca: string;
  cdtca_name: string;
  center_latitude: number;
  center_longitude: number;
  shape_area?: string;
  shape_leng?: string;
  geojsonDataId?: string;
}) {
  try {
    return await db
      .insert(nycNeighborhoods)
      .values({
        name,
        borough,
        nta_code,
        nta_name,
        nta_2020,
        cdtca,
        cdtca_name,
        center_latitude,
        center_longitude,
        shape_area,
        shape_leng,
        geojsonDataId,
      })
      .returning();
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create NYC neighborhood',
    );
  }
}

export async function getAllNYCNeighborhoods() {
  try {
    return await db
      .select()
      .from(nycNeighborhoods)
      .orderBy(asc(nycNeighborhoods.name));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get all NYC neighborhoods',
    );
  }
}

export async function getNYCNeighborhoodsByBorough({
  borough,
}: { borough: string }) {
  try {
    return await db
      .select()
      .from(nycNeighborhoods)
      .where(eq(nycNeighborhoods.borough, borough))
      .orderBy(asc(nycNeighborhoods.name));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get NYC neighborhoods by borough',
    );
  }
}

export async function searchNYCNeighborhoods({
  searchTerm,
}: { searchTerm: string }) {
  try {
    return await db
      .select()
      .from(nycNeighborhoods)
      .where(
        or(
          ilike(nycNeighborhoods.name, `%${searchTerm}%`),
          ilike(nycNeighborhoods.nta_name, `%${searchTerm}%`),
          ilike(nycNeighborhoods.borough, `%${searchTerm}%`),
        ),
      )
      .orderBy(asc(nycNeighborhoods.name));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to search NYC neighborhoods',
    );
  }
}

export async function getNYCNeighborhoodById({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(nycNeighborhoods)
      .where(eq(nycNeighborhoods.id, id));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get NYC neighborhood by ID',
    );
  }
}

export async function clearNYCNeighborhoods() {
  try {
    return await db.delete(nycNeighborhoods);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to clear NYC neighborhoods',
    );
  }
}

// PLUTO queries
export async function createPlutoLot({
  bbl,
  borough,
  block,
  lot,
  address,
  zipcode,
  ownerName,
  ownerType,
  landUse,
  landUseCode,
  buildingClass,
  buildingClassCode,
  yearBuilt,
  yearAltered,
  numFloors,
  numStories,
  lotArea,
  bldgArea,
  commFAR,
  resFAR,
  facilFAR,
  bldgFront,
  bldgDepth,
  lotFront,
  lotDepth,
  bldgClass,
  tract2010,
  xCoord,
  yCoord,
  latitude,
  longitude,
  councilDistrict,
  communityDistrict,
  policePrecinct,
  fireCompany,
  fireBattalion,
  fireDivision,
  healthArea,
  healthCenterDistrict,
  schoolDistrict,
  voterPrecinct,
  electionDistrict,
  assemblyDistrict,
  senateDistrict,
  congressionalDistrict,
  sanitationDistrict,
  sanitationSub,
  zoningDistrict,
  overlayDistrict1,
  overlayDistrict2,
  specialDistrict1,
  specialDistrict2,
  specialDistrict3,
  easements,
  landmark,
  far,
  irrLotCode,
  lotType,
  bsmtCode,
  assessLand,
  assessTot,
  exemptLand,
  exemptTot,
  yearAlter1,
  yearAlter2,
  histDist,
  lstAction,
  lstStatus,
  lstDate,
  lstReason,
  geojsonDataId,
}: {
  bbl: string;
  borough: string;
  block: string;
  lot: string;
  address?: string;
  zipcode?: string;
  ownerName?: string;
  ownerType?: string;
  landUse?: string;
  landUseCode?: string;
  buildingClass?: string;
  buildingClassCode?: string;
  yearBuilt?: number;
  yearAltered?: number;
  numFloors?: number;
  numStories?: number;
  lotArea?: number;
  bldgArea?: number;
  commFAR?: number;
  resFAR?: number;
  facilFAR?: number;
  bldgFront?: number;
  bldgDepth?: number;
  lotFront?: number;
  lotDepth?: number;
  bldgClass?: string;
  tract2010?: string;
  xCoord?: number;
  yCoord?: number;
  latitude?: number;
  longitude?: number;
  councilDistrict?: string;
  communityDistrict?: string;
  policePrecinct?: string;
  fireCompany?: string;
  fireBattalion?: string;
  fireDivision?: string;
  healthArea?: string;
  healthCenterDistrict?: string;
  schoolDistrict?: string;
  voterPrecinct?: string;
  electionDistrict?: string;
  assemblyDistrict?: string;
  senateDistrict?: string;
  congressionalDistrict?: string;
  sanitationDistrict?: string;
  sanitationSub?: string;
  zoningDistrict?: string;
  overlayDistrict1?: string;
  overlayDistrict2?: string;
  specialDistrict1?: string;
  specialDistrict2?: string;
  specialDistrict3?: string;
  easements?: string;
  landmark?: string;
  far?: number;
  irrLotCode?: string;
  lotType?: string;
  bsmtCode?: string;
  assessLand?: number;
  assessTot?: number;
  exemptLand?: number;
  exemptTot?: number;
  yearAlter1?: number;
  yearAlter2?: number;
  histDist?: string;
  lstAction?: string;
  lstStatus?: string;
  lstDate?: string;
  lstReason?: string;
  geojsonDataId?: string;
}) {
  try {
    return await db
      .insert(plutoLots)
      .values({
        bbl,
        borough,
        block,
        lot,
        address,
        zipcode,
        ownerName,
        ownerType,
        landUse,
        landUseCode,
        buildingClass,
        buildingClassCode,
        yearBuilt,
        yearAltered,
        numFloors,
        numStories,
        lotArea,
        bldgArea,
        commFAR,
        resFAR,
        facilFAR,
        bldgFront,
        bldgDepth,
        lotFront,
        lotDepth,
        bldgClass,
        tract2010,
        xCoord,
        yCoord,
        latitude,
        longitude,
        councilDistrict,
        communityDistrict,
        policePrecinct,
        fireCompany,
        fireBattalion,
        fireDivision,
        healthArea,
        healthCenterDistrict,
        schoolDistrict,
        voterPrecinct,
        electionDistrict,
        assemblyDistrict,
        senateDistrict,
        congressionalDistrict,
        sanitationDistrict,
        sanitationSub,
        zoningDistrict,
        overlayDistrict1,
        overlayDistrict2,
        specialDistrict1,
        specialDistrict2,
        specialDistrict3,
        easements,
        landmark,
        far,
        irrLotCode,
        lotType,
        bsmtCode,
        assessLand,
        assessTot,
        exemptLand,
        exemptTot,
        yearAlter1,
        yearAlter2,
        histDist,
        lstAction,
        lstStatus,
        lstDate,
        lstReason,
        geojsonDataId,
      })
      .returning();
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create PLUTO lot',
    );
  }
}

export async function getAllPlutoLots({ limit = 100 }: { limit?: number }) {
  try {
    return await db
      .select()
      .from(plutoLots)
      .limit(limit)
      .orderBy(asc(plutoLots.bbl));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get all PLUTO lots',
    );
  }
}

export async function getPlutoLotsByBorough({ borough }: { borough: string }) {
  try {
    return await db
      .select()
      .from(plutoLots)
      .where(eq(plutoLots.borough, borough))
      .orderBy(asc(plutoLots.bbl));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get PLUTO lots by borough',
    );
  }
}

export async function searchPlutoLots({
  searchTerm,
  limit = 50,
}: {
  searchTerm: string;
  limit?: number;
}) {
  try {
    return await db
      .select()
      .from(plutoLots)
      .where(
        or(
          ilike(plutoLots.address, `%${searchTerm}%`),
          ilike(plutoLots.ownerName, `%${searchTerm}%`),
          ilike(plutoLots.landUse, `%${searchTerm}%`),
          ilike(plutoLots.buildingClass, `%${searchTerm}%`),
          ilike(plutoLots.zoningDistrict, `%${searchTerm}%`),
        ),
      )
      .limit(limit)
      .orderBy(asc(plutoLots.bbl));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to search PLUTO lots',
    );
  }
}

export async function getPlutoLotByBBL({ bbl }: { bbl: string }) {
  try {
    return await db
      .select()
      .from(plutoLots)
      .where(eq(plutoLots.bbl, bbl))
      .limit(1);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get PLUTO lot by BBL',
    );
  }
}

export async function filterPlutoLots({
  borough,
  landUse,
  buildingClass,
  zoningDistrict,
  yearBuiltMin,
  yearBuiltMax,
  lotAreaMin,
  lotAreaMax,
  limit = 100,
}: {
  borough?: string;
  landUse?: string;
  buildingClass?: string;
  zoningDistrict?: string;
  yearBuiltMin?: number;
  yearBuiltMax?: number;
  lotAreaMin?: number;
  lotAreaMax?: number;
  limit?: number;
}) {
  try {
    let query = db.select().from(plutoLots);

    const conditions = [];

    if (borough) {
      conditions.push(eq(plutoLots.borough, borough));
    }
    if (landUse) {
      conditions.push(eq(plutoLots.landUse, landUse));
    }
    if (buildingClass) {
      conditions.push(eq(plutoLots.buildingClass, buildingClass));
    }
    if (zoningDistrict) {
      conditions.push(eq(plutoLots.zoningDistrict, zoningDistrict));
    }
    if (yearBuiltMin !== undefined) {
      conditions.push(gte(plutoLots.yearBuilt, yearBuiltMin));
    }
    if (yearBuiltMax !== undefined) {
      conditions.push(lte(plutoLots.yearBuilt, yearBuiltMax));
    }
    if (lotAreaMin !== undefined) {
      conditions.push(gte(plutoLots.lotArea, lotAreaMin));
    }
    if (lotAreaMax !== undefined) {
      conditions.push(lte(plutoLots.lotArea, lotAreaMax));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.limit(limit).orderBy(asc(plutoLots.bbl));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to filter PLUTO lots',
    );
  }
}

export async function clearPlutoLots() {
  try {
    return await db.delete(plutoLots);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to clear PLUTO lots',
    );
  }
}

export async function getPlutoLotsByArea({
  areaId,
  limit = 100,
}: {
  areaId: string;
  limit?: number;
}) {
  try {
    // First get the area's GeoJSON data
    const area = await getAreaByChatId({ chatId: areaId });
    if (!area || !area[0]?.geojsonDataId) {
      throw new ChatSDKError(
        'bad_request:database',
        'Area not found or no geometry data available',
      );
    }

    const geojsonData = await getGeoJSONDataById({
      id: area[0].geojsonDataId,
    });

    if (!geojsonData || !geojsonData[0]?.data) {
      throw new ChatSDKError(
        'bad_request:database',
        'Area geometry data not found',
      );
    }

    const areaGeometry = geojsonData[0].data;

    // For now, we'll use a bounding box approach since we don't have spatial queries set up
    // In a production environment, you'd want to use PostGIS for proper spatial queries
    let lots = await getAllPlutoLots({ limit: 1000 }); // Get more lots to filter

    // Filter lots that are within the area's bounding box
    // This is a simplified approach - for precise spatial queries, use PostGIS
    const filteredLots = lots.filter((lot) => {
      if (!lot.latitude || !lot.longitude) return false;

      // Simple bounding box check (this is approximate)
      // In a real implementation, you'd use PostGIS ST_Contains or similar
      const lat = Number(lot.latitude);
      const lng = Number(lot.longitude);

      // For now, we'll return all lots with coordinates
      // The actual spatial filtering would depend on the area geometry
      return lat !== 0 && lng !== 0;
    });

    return filteredLots.slice(0, limit);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get PLUTO lots by area',
    );
  }
}
