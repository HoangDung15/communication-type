"use client";

import { useEffect, useState } from "react";
import { registeredStore } from "./client-store";

// true khi máy này đã gửi đăng ký tư vấn thành công. Đọc sau khi mount để tránh lệch SSR.
export function useRegistered(): boolean {
  const [registered, setRegistered] = useState(false);
  useEffect(() => {
    setRegistered(Boolean(registeredStore.get()));
  }, []);
  return registered;
}
