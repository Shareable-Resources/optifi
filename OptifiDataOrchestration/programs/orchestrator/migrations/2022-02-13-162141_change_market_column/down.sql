ALTER TABLE "instruments" DROP COLUMN market_id CASCADE;
ALTER TABLE "chains" ADD COLUMN market_id int NOT NULL DEFAULT 0;

ALTER TABLE "chains" ADD FOREIGN KEY ("market_id") REFERENCES "optifi_markets" ("id");