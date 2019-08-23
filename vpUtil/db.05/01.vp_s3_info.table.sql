CREATE TABLE vp_s3_info
(
    "bucketName" text NOT NULL,
    "accessKeyId" text NOT NULL,
    "secretAccessKey" text NOT NULL,
    region text NOT NULL,
    CONSTRAINT "vp_s3_info_bucketName_key" UNIQUE ("bucketName")

);

INSERT INTO vp_s3_info ("bucketName", region, "accessKeyId", "secretAccessKey")
VALUES ('vpatlas.data', 'us-east-1', 'AKIA377XAEZJWMGYEAN7', '8+V485pgurohh09peVM7EsvTy7yQlAaohAwYMp3w');