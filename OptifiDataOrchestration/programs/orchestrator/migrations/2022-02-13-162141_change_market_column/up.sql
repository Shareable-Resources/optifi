ALTER TABLE "chains" DROP COLUMN market_id CASCADE;
ALTER TABLE "instruments" ADD COLUMN market_id int NOT NULL DEFAULT 0;

ALTER TABLE "instruments" ADD FOREIGN KEY ("market_id") REFERENCES "optifi_markets" ("id");