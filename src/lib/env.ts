const apiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error(
    "NEXT_PUBLIC_API_URL is not set. Copy .env.example to .env.local and set it."
  );
}

export const env = {
  apiUrl: apiUrl.replace(/\/+$/, ""),
};
