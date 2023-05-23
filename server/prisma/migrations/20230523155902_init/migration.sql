-- Generate a custom UUID v8 with microsecond precision
create or replace function uuid_generate_v8()
returns uuid
as $$
declare
  unix_ts_ms bytea;
  uuid_bytes bytea;
  timestamp    timestamptz;
  microseconds int;
begin
  timestamp    = clock_timestamp();
  unix_ts_ms = substring(int8send(floor(extract(epoch from timestamp) * 1000)::bigint) from 3);
  microseconds = (cast(extract(microseconds from timestamp)::int - (floor(extract(milliseconds from timestamp))::int * 1000) as double precision) * 4.096)::int;

  -- use random v4 uuid as starting point (which has the same variant we need)
  uuid_bytes = uuid_send(gen_random_uuid());

  -- overlay timestamp
  uuid_bytes = overlay(uuid_bytes placing unix_ts_ms from 1 for 6);

  -- set version 8 and add microseconds
  uuid_bytes = set_byte(uuid_bytes, 6, (b'1000' || (microseconds >> 8)::bit(4))::bit(8)::int);
  uuid_bytes = set_byte(uuid_bytes, 7, microseconds::bit(8)::int);

  return encode(uuid_bytes, 'hex')::uuid;
end
$$
language plpgsql
volatile;

-- CreateTable
CREATE TABLE "Song" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v8(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "link" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "Song_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v8(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "text" TEXT,
    "reviewerEmail" TEXT,
    "songCreatorEmailedAt" TIMESTAMP(3),
    "songId" UUID NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
