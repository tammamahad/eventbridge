import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../api";

export default function Messages({ auth }) {
    const location = useLocation();
    const selectedFromQuery = Number(new URLSearchParams(location.search).get("bookingId"));
    const customerEmail = auth?.customerEmail || "";
    const customerName = auth?.customerName || "Customer";
    const vendorId = auth?.vendorId || null;
    const role = auth?.role || "NONE";

    const [threads, setThreads] = useState([]);
    const [threadsLoading, setThreadsLoading] = useState(true);
    const [activeBookingId, setActiveBookingId] = useState(null);
    const [chatRows, setChatRows] = useState([]);
    const [chatLoading, setChatLoading] = useState(false);
    const [chatDraft, setChatDraft] = useState("");
    const [chatAttachment, setChatAttachment] = useState(null);
    const [chatSending, setChatSending] = useState(false);
    const [msg, setMsg] = useState("");

    const lockedOut =
        role === "NONE" ||
        (role === "CUSTOMER" && !customerEmail) ||
        (role === "VENDOR" && !vendorId);

    async function loadThreads() {
        if (lockedOut) {
            setThreadsLoading(false);
            return;
        }

        setThreadsLoading(true);
        setMsg("");
        try {
            const bookings = role === "VENDOR"
                ? await api.getVendorBookings(vendorId)
                : await api.getCustomerBookings(customerEmail);

            const list = Array.isArray(bookings) ? bookings : [];
            const enriched = await Promise.all(
                list.map(async (booking) => {
                    try {
                        const messages = await api.getBookingMessages(booking.id);
                        const last = messages[messages.length - 1] || null;
                        return {
                            booking,
                            lastMessage: last?.body || (last?.attachmentName ? `Attachment: ${last.attachmentName}` : "No messages yet"),
                            lastAt: last?.createdAt || null,
                            messageCount: messages.length,
                        };
                    } catch {
                        return {
                            booking,
                            lastMessage: "Unable to load preview",
                            lastAt: null,
                            messageCount: 0,
                        };
                    }
                })
            );

            enriched.sort((a, b) => {
                const at = a.lastAt ? new Date(a.lastAt).getTime() : 0;
                const bt = b.lastAt ? new Date(b.lastAt).getTime() : 0;
                if (bt !== at) return bt - at;
                return String(b.booking?.eventDate || "").localeCompare(String(a.booking?.eventDate || ""));
            });

            setThreads(enriched);

            const deepLinked = Number.isFinite(selectedFromQuery) ? selectedFromQuery : null;
            const first = enriched[0]?.booking?.id ?? null;
            const picked = deepLinked && enriched.some((t) => t.booking.id === deepLinked) ? deepLinked : first;
            setActiveBookingId((prev) => prev ?? picked);
        } catch (e) {
            setThreads([]);
            setMsg(e.message);
        } finally {
            setThreadsLoading(false);
        }
    }

    useEffect(() => {
        loadThreads();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role, customerEmail, vendorId]);

    const activeThread = useMemo(
        () => threads.find((t) => t.booking.id === activeBookingId) || null,
        [threads, activeBookingId]
    );

    useEffect(() => {
        if (!activeBookingId) {
            setChatRows([]);
            return;
        }
        let alive = true;
        setChatLoading(true);
        api.getBookingMessages(activeBookingId)
            .then((rows) => {
                if (!alive) return;
                setChatRows(Array.isArray(rows) ? rows : []);
            })
            .catch((e) => {
                if (!alive) return;
                setMsg(e.message);
                setChatRows([]);
            })
            .finally(() => {
                if (alive) setChatLoading(false);
            });
        return () => {
            alive = false;
        };
    }, [activeBookingId]);

    async function sendChatMessage() {
        if (!activeBookingId) return;
        const body = chatDraft.trim();
        if (!body && !chatAttachment) return;

        const vendorDisplayName =
            activeThread?.booking?.vendor?.businessName ||
            activeThread?.booking?.vendorName ||
            `Vendor #${vendorId}`;

        setChatSending(true);
        try {
            const created = await api.sendBookingMessage(activeBookingId, {
                senderRole: role,
                senderName: role === "VENDOR" ? vendorDisplayName : customerName,
                body,
                attachment: chatAttachment
                    ? {
                        fileName: chatAttachment.fileName,
                        contentType: chatAttachment.contentType,
                        sizeBytes: chatAttachment.sizeBytes,
                        base64Data: chatAttachment.base64Data,
                    }
                    : null,
            });
            setChatRows((prev) => [...prev, created]);
            setChatDraft("");
            setChatAttachment(null);

            setThreads((prev) =>
                [...prev]
                    .map((t) =>
                        t.booking.id === activeBookingId
                            ? {
                                ...t,
                                lastMessage: created.body || (created.attachmentName ? `Attachment: ${created.attachmentName}` : "New message"),
                                lastAt: created.createdAt || null,
                                messageCount: (t.messageCount || 0) + 1,
                            }
                            : t
                    )
                    .sort((a, b) => {
                        const at = a.lastAt ? new Date(a.lastAt).getTime() : 0;
                        const bt = b.lastAt ? new Date(b.lastAt).getTime() : 0;
                        return bt - at;
                    })
            );
        } catch (e) {
            setMsg(e.message);
        } finally {
            setChatSending(false);
        }
    }

    async function onChatAttachmentChange(e) {
        const file = e.target.files?.[0];
        if (!file) {
            setChatAttachment(null);
            return;
        }

        const isAllowed = file.type.startsWith("image/") || file.type === "application/pdf";
        if (!isAllowed) {
            setMsg("Attachment must be an image or PDF.");
            e.target.value = "";
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setMsg("Attachment must be 10MB or smaller.");
            e.target.value = "";
            return;
        }

        const base64Data = await readFileAsBase64(file);
        setChatAttachment({
            fileName: file.name,
            contentType: file.type,
            sizeBytes: file.size,
            base64Data,
        });
    }

    function formatDateTime(value) {
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return "";
        return d.toLocaleString();
    }

    function formatBytes(bytes) {
        const n = Number(bytes);
        if (!Number.isFinite(n) || n <= 0) return "";
        if (n < 1024) return `${n} B`;
        if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
        return `${(n / (1024 * 1024)).toFixed(1)} MB`;
    }

    function attachmentDataUrl(message) {
        if (!message?.attachmentDataBase64 || !message?.attachmentContentType) return null;
        return `data:${message.attachmentContentType};base64,${message.attachmentDataBase64}`;
    }

    function threadTitle(thread) {
        if (!thread) return "";
        if (role === "VENDOR") return thread.booking?.customerName || "Customer";
        return thread.booking?.vendor?.businessName || `Vendor #${thread.booking?.vendor?.id || "?"}`;
    }

    if (lockedOut) {
        return (
            <div className="page">
                <div className="hero">
                    <h1 className="h1">Messages</h1>
                    <p className="muted">Login as a customer or vendor to access messaging.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="hero">
                <h1 className="h1">Messages</h1>
                <p className="muted">All booking conversations in one place.</p>
            </div>

            {msg && <div className="status">{msg}</div>}

            <div className="messages-layout">
                <div className="card messages-threads">
                    <div className="messages-threads-head">
                        <div className="h3">Conversations</div>
                        <span className="pill subtle">{threads.length}</span>
                    </div>

                    {threadsLoading ? (
                        <div className="muted">Loading conversations…</div>
                    ) : (
                        <div className="thread-list">
                            {threads.map((thread) => (
                                <button
                                    key={thread.booking.id}
                                    className={thread.booking.id === activeBookingId ? "thread-item active" : "thread-item"}
                                    onClick={() => setActiveBookingId(thread.booking.id)}
                                >
                                    <div className="thread-top">
                                        <strong>{threadTitle(thread)}</strong>
                                        <span className={`badge ${String(thread.booking?.status || "").toLowerCase()}`}>
                                            {thread.booking?.status}
                                        </span>
                                    </div>
                                    <div className="thread-sub muted small">
                                        {thread.booking?.eventDate} • Booking #{thread.booking?.id}
                                    </div>
                                    <div className="thread-preview">{thread.lastMessage || "No messages yet"}</div>
                                </button>
                            ))}
                            {threads.length === 0 && (
                                <div className="muted small">No booking conversations yet.</div>
                            )}
                        </div>
                    )}
                </div>

                <div className="card chat-card messages-chat">
                    {activeThread ? (
                        <>
                            <div className="chat-head">
                                <div>
                                    <div className="h3">{threadTitle(activeThread)}</div>
                                    <div className="muted small">
                                        {activeThread.booking?.eventDate} • Booking #{activeThread.booking?.id}
                                    </div>
                                </div>
                                <span className={`badge ${String(activeThread.booking?.status || "").toLowerCase()}`}>
                                    {activeThread.booking?.status}
                                </span>
                            </div>

                            {chatLoading ? (
                                <div className="muted">Loading messages…</div>
                            ) : (
                                <div className="chat-list">
                                    {chatRows.map((m) => (
                                        <div key={m.id} className={`chat-bubble ${m.senderRole === role ? "mine" : ""}`}>
                                            <div className="chat-meta">
                                                <strong>{m.senderName}</strong>
                                                <span>{formatDateTime(m.createdAt)}</span>
                                            </div>
                                            <div>{m.body}</div>
                                            {m.attachmentName && (
                                                <div className="chat-attachment">
                                                    {String(m.attachmentContentType || "").startsWith("image/") && attachmentDataUrl(m) ? (
                                                        <img
                                                            src={attachmentDataUrl(m)}
                                                            alt={m.attachmentName}
                                                            className="chat-attachment-image"
                                                        />
                                                    ) : (
                                                        <a href={attachmentDataUrl(m) || "#"} download={m.attachmentName}>
                                                            {m.attachmentName}
                                                        </a>
                                                    )}
                                                    <div className="muted small">
                                                        {m.attachmentContentType} {m.attachmentSizeBytes ? `• ${formatBytes(m.attachmentSizeBytes)}` : ""}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {chatRows.length === 0 && (
                                        <div className="muted small">No messages yet. Start the conversation.</div>
                                    )}
                                </div>
                            )}

                            <div className="chat-compose">
                                <input
                                    className="input"
                                    placeholder="Write a message..."
                                    value={chatDraft}
                                    onChange={(e) => setChatDraft(e.target.value)}
                                />
                                <div className="chat-attachment-pick">
                                    <input type="file" accept="image/*,application/pdf" onChange={onChatAttachmentChange} />
                                    {chatAttachment && (
                                        <div className="muted small">
                                            Attached: {chatAttachment.fileName} ({formatBytes(chatAttachment.sizeBytes)})
                                        </div>
                                    )}
                                </div>
                                <button
                                    className="btn"
                                    disabled={chatSending || (!chatDraft.trim() && !chatAttachment)}
                                    onClick={sendChatMessage}
                                >
                                    {chatSending ? "Sending..." : "Send"}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="messages-empty">
                            <div className="h3">No conversation selected</div>
                            <div className="muted small">Pick a booking thread from the left list.</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const raw = String(reader.result || "");
            const base64 = raw.includes(",") ? raw.split(",")[1] : raw;
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
