CREATE TABLE "documentation" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"repositoryId" varchar(255) NOT NULL,
	"readme" text,
	"contributing" text,
	"license" text,
	"changelog" text,
	"folderStructure" jsonb,
	"dependencies" jsonb,
	"codeDocstrings" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "documentation_repositoryId_unique" UNIQUE("repositoryId")
);
--> statement-breakpoint
ALTER TABLE "documentation" ADD CONSTRAINT "documentation_repositoryId_repositories_id_fk" FOREIGN KEY ("repositoryId") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;