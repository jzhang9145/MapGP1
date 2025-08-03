CREATE TABLE IF NOT EXISTS "Area" (
	"chatId" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"summary" text NOT NULL,
	"geojson" json NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Area" ADD CONSTRAINT "Area_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
