import axios from "axios";

const api = axios.create({
    baseURL:
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
    // OR for relative URLs, you can use empty string
    // baseURL: '',
    // timeout: 1000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  export default api;
