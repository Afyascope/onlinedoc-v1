CREATE TABLE "catalogue_releases" (
	"id" text PRIMARY KEY NOT NULL,
	"domain" text NOT NULL,
	"file_name" text NOT NULL,
	"file_checksum" text NOT NULL,
	"file_size" integer,
	"mime_type" text,
	"file_type" text,
	"source_name" text,
	"source_identifier" text,
	"source_version" text,
	"source_url" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"row_count" integer DEFAULT 0 NOT NULL,
	"valid_row_count" integer DEFAULT 0 NOT NULL,
	"invalid_row_count" integer DEFAULT 0 NOT NULL,
	"new_count" integer DEFAULT 0 NOT NULL,
	"updated_count" integer DEFAULT 0 NOT NULL,
	"unchanged_count" integer DEFAULT 0 NOT NULL,
	"error_count" integer DEFAULT 0 NOT NULL,
	"warning_count" integer DEFAULT 0 NOT NULL,
	"validation_result" jsonb,
	"rows" jsonb,
	"transformation_notes" text,
	"notes" text,
	"imported_by" text NOT NULL,
	"approved_by" text,
	"activated_by" text,
	"validated_at" timestamp,
	"approved_at" timestamp,
	"activated_at" timestamp,
	"retired_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalogue_resource_history" (
	"id" text PRIMARY KEY NOT NULL,
	"resource_id" text NOT NULL,
	"release_id" text NOT NULL,
	"action" text NOT NULL,
	"actor_id" text,
	"before" jsonb,
	"after" jsonb,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalogue_resources" (
	"id" text PRIMARY KEY NOT NULL,
	"release_id" text NOT NULL,
	"domain" text NOT NULL,
	"stable_identifier" text NOT NULL,
	"code" text,
	"name" text NOT NULL,
	"description" text,
	"coding_system" text,
	"coding_system_version" text,
	"synonyms" text,
	"category" text,
	"specimen" text,
	"modality" text,
	"generic_name" text,
	"brand_name" text,
	"active_ingredient" text,
	"strength" text,
	"dosage_form" text,
	"route" text,
	"source" text,
	"source_identifier" text,
	"source_version" text,
	"source_url" text,
	"provenance_notes" text,
	"lifecycle" text DEFAULT 'imported' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"effective_from" date,
	"effective_to" date,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consultation_diagnoses" (
	"id" text PRIMARY KEY NOT NULL,
	"consultation_id" text NOT NULL,
	"resource_id" text NOT NULL,
	"release_id" text NOT NULL,
	"code_snapshot" text,
	"name_snapshot" text NOT NULL,
	"coding_system_snapshot" text,
	"coding_system_version_snapshot" text,
	"source_snapshot" text,
	"source_identifier_snapshot" text,
	"release_version_snapshot" text,
	"notes" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"selected_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consultation_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"consultation_id" text NOT NULL,
	"document_type" text NOT NULL,
	"generated_by" text NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"checksum" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consultation_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"consultation_id" text NOT NULL,
	"domain" text NOT NULL,
	"resource_id" text NOT NULL,
	"release_id" text NOT NULL,
	"code_snapshot" text,
	"name_snapshot" text NOT NULL,
	"category_snapshot" text,
	"modality_snapshot" text,
	"source_snapshot" text,
	"source_identifier_snapshot" text,
	"release_version_snapshot" text,
	"notes" text,
	"status" text DEFAULT 'requested' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"requested_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "consultation_notes" ADD COLUMN "history_notes" text;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD COLUMN "consultation_id" text;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD COLUMN "catalogue_resource_id" text;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD COLUMN "catalogue_release_id" text;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD COLUMN "generic_name_snapshot" text;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD COLUMN "brand_name_snapshot" text;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD COLUMN "strength_snapshot" text;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD COLUMN "dosage_form_snapshot" text;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD COLUMN "route_snapshot" text;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD COLUMN "source_snapshot" text;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD COLUMN "source_identifier_snapshot" text;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD COLUMN "release_version_snapshot" text;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD COLUMN "dosage_form" text;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD COLUMN "duration" text;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD COLUMN "route" text;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD COLUMN "selected_by" text;--> statement-breakpoint
ALTER TABLE "catalogue_releases" ADD CONSTRAINT "catalogue_releases_imported_by_user_id_fk" FOREIGN KEY ("imported_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalogue_releases" ADD CONSTRAINT "catalogue_releases_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalogue_releases" ADD CONSTRAINT "catalogue_releases_activated_by_user_id_fk" FOREIGN KEY ("activated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalogue_resource_history" ADD CONSTRAINT "catalogue_resource_history_resource_id_catalogue_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."catalogue_resources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalogue_resource_history" ADD CONSTRAINT "catalogue_resource_history_release_id_catalogue_releases_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."catalogue_releases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalogue_resource_history" ADD CONSTRAINT "catalogue_resource_history_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalogue_resources" ADD CONSTRAINT "catalogue_resources_release_id_catalogue_releases_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."catalogue_releases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultation_diagnoses" ADD CONSTRAINT "consultation_diagnoses_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultation_diagnoses" ADD CONSTRAINT "consultation_diagnoses_resource_id_catalogue_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."catalogue_resources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultation_diagnoses" ADD CONSTRAINT "consultation_diagnoses_release_id_catalogue_releases_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."catalogue_releases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultation_diagnoses" ADD CONSTRAINT "consultation_diagnoses_selected_by_user_id_fk" FOREIGN KEY ("selected_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultation_documents" ADD CONSTRAINT "consultation_documents_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultation_documents" ADD CONSTRAINT "consultation_documents_generated_by_user_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultation_requests" ADD CONSTRAINT "consultation_requests_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultation_requests" ADD CONSTRAINT "consultation_requests_resource_id_catalogue_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."catalogue_resources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultation_requests" ADD CONSTRAINT "consultation_requests_release_id_catalogue_releases_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."catalogue_releases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultation_requests" ADD CONSTRAINT "consultation_requests_requested_by_user_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "catalogue_releases_domain_status_idx" ON "catalogue_releases" USING btree ("domain","status");--> statement-breakpoint
CREATE INDEX "catalogue_releases_domain_checksum_idx" ON "catalogue_releases" USING btree ("domain","file_checksum");--> statement-breakpoint
CREATE INDEX "catalogue_resource_history_resource_idx" ON "catalogue_resource_history" USING btree ("resource_id");--> statement-breakpoint
CREATE UNIQUE INDEX "catalogue_resources_release_domain_identifier_unique" ON "catalogue_resources" USING btree ("release_id","domain","stable_identifier");--> statement-breakpoint
CREATE INDEX "catalogue_resources_domain_lifecycle_idx" ON "catalogue_resources" USING btree ("domain","lifecycle");--> statement-breakpoint
CREATE INDEX "catalogue_resources_release_domain_idx" ON "catalogue_resources" USING btree ("release_id","domain");--> statement-breakpoint
CREATE INDEX "catalogue_resources_source_identifier_idx" ON "catalogue_resources" USING btree ("source","source_identifier");--> statement-breakpoint
CREATE INDEX "consultation_diagnoses_consultation_idx" ON "consultation_diagnoses" USING btree ("consultation_id");--> statement-breakpoint
CREATE INDEX "consultation_diagnoses_resource_idx" ON "consultation_diagnoses" USING btree ("resource_id");--> statement-breakpoint
CREATE INDEX "consultation_documents_consultation_type_idx" ON "consultation_documents" USING btree ("consultation_id","document_type");--> statement-breakpoint
CREATE INDEX "consultation_requests_consultation_domain_idx" ON "consultation_requests" USING btree ("consultation_id","domain");--> statement-breakpoint
CREATE INDEX "consultation_requests_resource_idx" ON "consultation_requests" USING btree ("resource_id");--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_catalogue_resource_id_catalogue_resources_id_fk" FOREIGN KEY ("catalogue_resource_id") REFERENCES "public"."catalogue_resources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_catalogue_release_id_catalogue_releases_id_fk" FOREIGN KEY ("catalogue_release_id") REFERENCES "public"."catalogue_releases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_selected_by_user_id_fk" FOREIGN KEY ("selected_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "prescriptions_consultation_id_idx" ON "prescriptions" USING btree ("consultation_id");--> statement-breakpoint
CREATE INDEX "prescriptions_catalogue_resource_id_idx" ON "prescriptions" USING btree ("catalogue_resource_id");--> statement-breakpoint
ALTER TABLE "catalogue_releases" ADD CONSTRAINT "catalogue_releases_domain_check" CHECK ("domain" IN ('diagnosis', 'laboratory', 'radiology', 'medication'));--> statement-breakpoint
ALTER TABLE "catalogue_releases" ADD CONSTRAINT "catalogue_releases_status_check" CHECK ("status" IN ('draft', 'validated', 'approved', 'active', 'retired', 'failed'));--> statement-breakpoint
ALTER TABLE "catalogue_resources" ADD CONSTRAINT "catalogue_resources_domain_check" CHECK ("domain" IN ('diagnosis', 'laboratory', 'radiology', 'medication'));--> statement-breakpoint
ALTER TABLE "catalogue_resources" ADD CONSTRAINT "catalogue_resources_lifecycle_check" CHECK ("lifecycle" IN ('imported', 'validated', 'active', 'inactive', 'retired'));--> statement-breakpoint
ALTER TABLE "catalogue_resources" ADD CONSTRAINT "catalogue_resources_effective_dates_check" CHECK ("effective_to" IS NULL OR "effective_from" IS NULL OR "effective_to" >= "effective_from");--> statement-breakpoint
ALTER TABLE "consultation_requests" ADD CONSTRAINT "consultation_requests_domain_check" CHECK ("domain" IN ('laboratory', 'radiology'));--> statement-breakpoint
ALTER TABLE "consultation_documents" ADD CONSTRAINT "consultation_documents_type_check" CHECK ("document_type" IN ('prescription', 'laboratory', 'radiology', 'report', 'facesheet'));
