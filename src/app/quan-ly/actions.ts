"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  changeOwnPassword,
  createManager,
  findUserForLogin,
  normalizeUsername,
  resetPassword,
  setManagerActive,
  transferRegistration,
  updateRegistration,
  type CreateManagerResult,
} from "@/lib/admin-data";
import { endSession, hashPassword, requireAdmin, requireUser, startSession, verifyPassword } from "@/lib/auth";
import { isRateLimited } from "@/lib/rate-limit";
import { isStatus } from "@/lib/statuses";

// Mọi action đều tự kiểm tra đăng nhập và quyền, vì action có thể bị gọi thẳng bằng POST.

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "");

// Dùng khi không tìm thấy tài khoản, để thời gian phản hồi giống nhau (không lộ tên đăng nhập có tồn tại hay không).
let dummyHash: Promise<string> | null = null;

export async function loginAction(
  _prev: { error?: string; username?: string } | null,
  fd: FormData,
): Promise<{ error?: string; username?: string }> {
  // Trả lại tên đăng nhập để form giữ nguyên khi báo lỗi
  const typed = str(fd, "username").trim().slice(0, 32);
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(`login:${ip}`)) return { error: "Bạn đã thử quá nhiều lần, vui lòng đợi ít phút rồi thử lại", username: typed };

  const username = normalizeUsername(typed);
  const password = str(fd, "password");
  const user = username ? await findUserForLogin(username) : null;
  dummyHash ??= hashPassword("not-a-real-password");
  const ok = await verifyPassword(password, user?.hash ?? (await dummyHash));
  if (!user || !ok) return { error: "Tên đăng nhập hoặc mật khẩu chưa đúng", username: typed };

  await startSession(user.id);
  redirect("/quan-ly");
}

export async function logoutAction(): Promise<void> {
  await endSession();
  redirect("/quan-ly/dang-nhap");
}

export async function updateStatusAction(fd: FormData): Promise<void> {
  const user = await requireUser();
  const id = Number(str(fd, "id"));
  const status = str(fd, "status");
  if (!id || !isStatus(status)) return;
  await updateRegistration(user, id, { status });
  revalidatePath("/quan-ly", "layout");
}

export async function updateNoteAction(_prev: { saved?: boolean } | null, fd: FormData): Promise<{ saved?: boolean }> {
  const user = await requireUser();
  const id = Number(str(fd, "id"));
  if (!id) return {};
  const saved = await updateRegistration(user, id, { note: str(fd, "note").trim() });
  revalidatePath("/quan-ly", "layout");
  return { saved };
}

// Chuyển đơn của BNV cho một quản lý KV (quy tắc kiểm tra trong transferRegistration).
export async function transferAction(_prev: { error?: string } | null, fd: FormData): Promise<{ error?: string }> {
  const user = await requireUser();
  const id = Number(str(fd, "id"));
  const target = Number(str(fd, "managerId"));
  if (!id || !target) return { error: "Vui lòng chọn người nhận đơn" };
  const ok = await transferRegistration(user, id, target);
  if (!ok) return { error: "Không chuyển được đơn này (chỉ đơn của BNV mới được chuyển, và chỉ chuyển một lần)" };
  revalidatePath("/quan-ly", "layout");
  // BNV không còn quyền xem đơn sau khi đã chuyển: đưa về danh sách
  redirect(user.role === "admin" ? `/quan-ly/dang-ky/${id}` : "/quan-ly");
}

export async function createManagerAction(_prev: CreateManagerResult | null, fd: FormData): Promise<CreateManagerResult> {
  await requireAdmin();
  const result = await createManager({ name: str(fd, "name"), ref: str(fd, "ref"), username: str(fd, "username") });
  if (result.ok) revalidatePath("/quan-ly/nguoi-quan-ly");
  return result;
}

export async function toggleManagerAction(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(str(fd, "managerId"));
  if (!id) return;
  await setManagerActive(id, str(fd, "active") === "true");
  revalidatePath("/quan-ly", "layout");
}

export async function resetPasswordAction(
  _prev: { username: string; password: string } | null,
  fd: FormData,
): Promise<{ username: string; password: string } | null> {
  await requireAdmin();
  const userId = Number(str(fd, "userId"));
  return userId ? resetPassword(userId) : null;
}

export async function changePasswordAction(
  _prev: { error?: string; ok?: boolean } | null,
  fd: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const user = await requireUser();
  const next = str(fd, "next");
  if (next !== str(fd, "confirm")) return { error: "Hai lần nhập mật khẩu mới chưa khớp" };
  const error = await changeOwnPassword(user, str(fd, "current"), next);
  return error ? { error } : { ok: true };
}
