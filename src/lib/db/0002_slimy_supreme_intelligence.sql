ALTER TABLE "feeds" DROP CONSTRAINT "feeds_url_users_id_fk";
--> statement-breakpoint
ALTER TABLE "feeds" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "feeds" ADD CONSTRAINT "feeds_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;