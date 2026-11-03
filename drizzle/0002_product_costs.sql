CREATE TABLE "product_costs" (
	"product_id" text PRIMARY KEY NOT NULL,
	"unit_cost" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "unit_cost" integer;