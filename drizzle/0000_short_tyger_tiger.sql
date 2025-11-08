CREATE TABLE "repositories" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"owner" varchar(255) NOT NULL,
	"url" varchar(500) NOT NULL,
	"description" text,
	"stars" integer DEFAULT 0,
	"language" varchar(100),
	"chunksIndexed" integer DEFAULT 0 NOT NULL,
	"status" varchar(50) DEFAULT 'indexed' NOT NULL,
	"indexedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "repositories_url_unique" UNIQUE("url")
);
