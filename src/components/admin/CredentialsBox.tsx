"use client";

import { CopyButton } from "./CopyButton";

// Hiện tài khoản vừa tạo / mật khẩu vừa đặt lại. Mật khẩu chỉ hiện một lần.
export function CredentialsBox({
  title,
  username,
  password,
  loginUrl,
}: {
  title: string;
  username: string;
  password: string;
  loginUrl: string;
}) {
  const message = `Trang quản lý: ${loginUrl}\nTên đăng nhập: ${username}\nMật khẩu: ${password}`;

  return (
    <div role="status" className="flex flex-col gap-2 rounded-xl border border-mint/40 bg-mint-faint p-4 text-sm">
      <p className="font-bold text-mint-dark">{title}</p>
      <dl className="grid grid-cols-[110px_minmax(0,1fr)] gap-y-1">
        <dt className="text-muted">Trang quản lý</dt>
        <dd className="break-all">{loginUrl}</dd>
        <dt className="text-muted">Tên đăng nhập</dt>
        <dd className="font-semibold">{username}</dd>
        <dt className="text-muted">Mật khẩu</dt>
        <dd className="font-mono font-semibold tracking-wide">{password}</dd>
      </dl>
      <div className="flex flex-wrap items-center gap-2">
        <CopyButton text={message} label="Sao chép thông tin đăng nhập" />
        <span className="text-xs text-muted">Mật khẩu chỉ hiện một lần, hãy gửi ngay cho người quản lý.</span>
      </div>
    </div>
  );
}
