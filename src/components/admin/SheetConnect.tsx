"use client";

import { useActionState, useEffect, useState } from "react";
import { connectSheetAction, disconnectSheetAction, syncSheetAction, type SheetActionState } from "@/app/quan-ly/actions";
import { AlertCircle, Check } from "../icons";
import { CopyButton } from "./CopyButton";
import { adminBtnPrimary, adminBtnSecondary, adminInput } from "./styles";

type Props = {
  configured: boolean;
  serviceEmail: string | null;
  isAdmin: boolean;
  sheet: { url: string; connectedAt: string } | null;
};

// Mỗi tài khoản tự kết nối Google Sheet riêng: chia sẻ quyền cho email robot rồi dán link.
export function SheetConnect({ configured, serviceEmail, isAdmin, sheet }: Props) {
  const scope = isAdmin ? "mọi đơn đăng ký" : "đơn của khách bạn phụ trách";
  const [changing, setChanging] = useState(false);
  // Thông báo sau khi kết nối/đổi Sheet: giữ ở đây vì form kết nối biến mất khi trang tải lại
  const [notice, setNotice] = useState<string | null>(null);
  const onConnected = (message: string) => {
    setChanging(false);
    setNotice(message);
  };

  if (!configured || !serviceEmail) {
    return (
      <p className="mt-2 rounded-[10px] bg-cream px-3.5 py-3 text-sm text-body">
        Admin chưa cài đặt kết nối Google nên chưa dùng được tính năng này.
      </p>
    );
  }

  if (sheet && changing) {
    return (
      <div className="mt-3 flex flex-col gap-1">
        <p className="rounded-[10px] bg-cream px-3.5 py-3 text-sm text-body">
          Đang dùng:{" "}
          <a href={sheet.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-dark underline">
            Sheet hiện tại ↗
          </a>
          . Sau khi đổi, đơn mới chỉ ghi vào Sheet mới; Sheet cũ giữ nguyên các dòng đã có.
        </p>
        <ConnectForm serviceEmail={serviceEmail} scope={scope} mode="change" onConnected={onConnected} />
        <button
          type="button"
          onClick={() => setChanging(false)}
          className="self-start text-sm font-semibold text-muted hover:text-ink"
        >
          Huỷ, giữ Sheet hiện tại
        </button>
      </div>
    );
  }

  if (sheet) {
    return (
      <div className="mt-3 flex flex-col gap-3">
        {notice ? (
          <StateMessage state={{ ok: true, message: notice }} />
        ) : (
          <p className="flex items-center gap-2 rounded-[10px] bg-mint-faint px-3.5 py-3 text-sm font-semibold text-mint-dark">
            <Check size={18} />
            Đã kết nối lúc {sheet.connectedAt}
          </p>
        )}
        <p className="text-sm leading-relaxed text-body">
          Mỗi đơn mới ({scope}) sẽ tự thêm một dòng vào tab <b>“Đăng ký”</b> của Sheet.
        </p>
        <div className="flex flex-wrap gap-2">
          <a href={sheet.url} target="_blank" rel="noopener noreferrer" className={adminBtnPrimary}>
            Mở Google Sheet ↗
          </a>
          <SyncButton />
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <button
            type="button"
            onClick={() => {
              setNotice(null);
              setChanging(true);
            }}
            className="text-sm font-semibold text-brand-dark hover:underline"
          >
            Đổi sang Sheet khác
          </button>
          <form
            action={disconnectSheetAction}
            onSubmit={(e) => {
              if (!confirm("Ngắt kết nối? Sheet vẫn giữ các dòng đã có, chỉ là đơn mới sẽ không được thêm vào nữa.")) e.preventDefault();
            }}
          >
            <button type="submit" className="text-sm font-semibold text-muted hover:text-danger">
              Ngắt kết nối
            </button>
          </form>
        </div>
        <SheetNote />
      </div>
    );
  }

  return <ConnectForm serviceEmail={serviceEmail} scope={scope} mode="connect" onConnected={onConnected} />;
}

function ConnectForm({
  serviceEmail,
  scope,
  mode,
  onConnected,
}: {
  serviceEmail: string;
  scope: string;
  mode: "connect" | "change";
  onConnected: (message: string) => void;
}) {
  const [state, action, pending] = useActionState<SheetActionState, FormData>(connectSheetAction, null);
  useEffect(() => {
    if (state?.ok && state.message) onConnected(state.message);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ báo một lần cho mỗi kết quả action
  }, [state]);
  const change = mode === "change";
  return (
    <form action={action} className="mt-3 flex flex-col gap-3">
      <p className="text-sm leading-relaxed text-body">
        {change
          ? `Dán link Sheet mới, ${scope} sẽ được đổ vào Sheet đó.`
          : `Kết nối một lần, sau đó ${scope} sẽ tự đổ về Google Sheet của bạn.`}
      </p>
      <ol className="flex list-decimal flex-col gap-2.5 pl-5 text-sm leading-relaxed text-body">
        <li>
          Vào <b>sheets.google.com</b>, tạo một bảng tính trống mới.
        </li>
        <li>
          Bấm <b>Chia sẻ</b>, dán email dưới đây, chọn quyền <b>Người chỉnh sửa</b> rồi bấm Gửi:
          <span className="mt-1.5 flex items-center gap-2 rounded-lg bg-cream px-2.5 py-2">
            <code className="min-w-0 flex-1 break-all text-xs text-ink">{serviceEmail}</code>
            <CopyButton text={serviceEmail} />
          </span>
        </li>
        <li>Sao chép link của bảng tính trên thanh địa chỉ, dán vào ô dưới và bấm Kết nối.</li>
      </ol>
      <input
        name="sheet"
        required
        inputMode="url"
        autoComplete="off"
        placeholder="https://docs.google.com/spreadsheets/d/…"
        aria-label="Link Google Sheet"
        className={adminInput}
      />
      <StateMessage state={state} />
      <button type="submit" disabled={pending} className={`${adminBtnPrimary} self-start`}>
        {pending ? "Đang kết nối..." : change ? "Đổi sang Sheet này" : "Kết nối"}
      </button>
      {!change && <SheetNote />}
    </form>
  );
}

function SyncButton() {
  const [state, action, pending] = useActionState<SheetActionState, FormData>(syncSheetAction, null);
  return (
    <form action={action} className="contents">
      <button type="submit" disabled={pending} className={adminBtnSecondary}>
        {pending ? "Đang đồng bộ..." : "Đồng bộ lại"}
      </button>
      {state && (
        <div className="basis-full">
          <StateMessage state={state} />
        </div>
      )}
    </form>
  );
}

function StateMessage({ state }: { state: SheetActionState }) {
  if (state?.error) {
    return (
      <p role="alert" className="flex items-start gap-2 rounded-[10px] bg-peach-soft px-3.5 py-3 text-sm text-danger">
        <AlertCircle size={18} className="mt-px shrink-0" />
        {state.error}
      </p>
    );
  }
  if (state?.ok && state.message) {
    return (
      <p role="status" className="flex items-start gap-2 rounded-[10px] bg-mint-faint px-3.5 py-3 text-sm font-semibold text-mint-dark">
        <Check size={18} className="mt-px shrink-0" />
        {state.message}
      </p>
    );
  }
  return null;
}

function SheetNote() {
  return (
    <p className="text-xs leading-relaxed text-muted">
      Sheet là bản sao để xem và lưu trữ. Trạng thái, ghi chú hay chuyển người phụ trách trên trang quản lý sẽ không tự cập
      nhật sang Sheet. “Đồng bộ lại” chỉ thêm các đơn còn thiếu, không xoá hay sửa dòng bạn đã có.
    </p>
  );
}
