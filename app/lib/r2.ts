import {DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client} from "@aws-sdk/client-s3";

const trimEnv = (name: string) => process.env[name]?.trim() || "";

const parseEndpoint = () => {
  const s3Api = trimEnv("R2_S3_API");
  if (s3Api) {
    const url = new URL(s3Api);
    const bucket = url.pathname.replace(/^\/+|\/+$/g, "");
    url.pathname = "";
    return {
      bucket: trimEnv("R2_BUCKET") || bucket,
      endpoint: url.toString().replace(/\/$/, ""),
    };
  }

  return {
    bucket: trimEnv("R2_BUCKET"),
    endpoint: trimEnv("R2_ENDPOINT"),
  };
};

const getConfig = () => {
  const {bucket, endpoint} = parseEndpoint();
  const accessKeyId = trimEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = trimEnv("R2_SECRET_ACCESS_KEY");

  if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("R2_S3_API (or R2_ENDPOINT + R2_BUCKET), R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY are required.");
  }

  return {accessKeyId, bucket, endpoint, secretAccessKey};
};

let client: S3Client | null = null;
let clientKey = "";

const getR2Client = () => {
  const config = getConfig();
  const nextClientKey = `${config.endpoint}:${config.accessKeyId}`;
  if (!client || clientKey !== nextClientKey) {
    client = new S3Client({
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      endpoint: config.endpoint,
      forcePathStyle: true,
      region: "auto",
    });
    clientKey = nextClientKey;
  }

  return {bucket: config.bucket, client};
};

const streamToBuffer = async (body: unknown) => {
  if (!body || typeof (body as {transformToByteArray?: unknown}).transformToByteArray !== "function") {
    throw new Error("R2 object body is not readable.");
  }
  const bytes = await (body as {transformToByteArray: () => Promise<Uint8Array>}).transformToByteArray();
  return Buffer.from(bytes);
};

export const putR2Object = async (key: string, body: Buffer, contentType = "application/octet-stream") => {
  const {bucket, client} = getR2Client();
  await client.send(new PutObjectCommand({
    Body: body,
    Bucket: bucket,
    ContentLength: body.length,
    ContentType: contentType,
    Key: key,
  }));
};

export const getR2Object = async (key: string) => {
  const {bucket, client} = getR2Client();
  const response = await client.send(new GetObjectCommand({Bucket: bucket, Key: key}));
  return streamToBuffer(response.Body);
};

export const deleteR2Object = async (key: string) => {
  const {bucket, client} = getR2Client();
  await client.send(new DeleteObjectCommand({Bucket: bucket, Key: key}));
};
