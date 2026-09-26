"use client";

import { useEffect, useState } from "react";
import {
  Globe,
  FileText,
  Video,
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  Radio,
  Eye,
  EyeOff,
  X,
  Award,
} from "lucide-react";
import { blogApi, mediaApi, teacherProfilesApi } from "@/lib/resources";
import { useToast } from "@/components/ui/Toast";
import { Loader } from "@/components/ui/Loader";
import { Button } from "@/components/ui/Button";
import type { BlogPost, MediaItem, TeacherProfile } from "@/types";

export default function AdminContentPage() {
  const [tab, setTab] = useState<"blog" | "media" | "teachers">("blog");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [teacherProfiles, setTeacherProfiles] = useState<TeacherProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Blog Modals & Forms
  const [showAddPostModal, setShowAddPostModal] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [postForm, setPostForm] = useState({
    title: "",
    content: "",
    excerpt: "",
    category: "فوائد قرآنية",
    author: "إدارة المدرسة",
    coverImage: "",
    published: true,
  });

  // Media Modals & Forms
  const [showAddMediaModal, setShowAddMediaModal] = useState(false);
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [mediaForm, setMediaForm] = useState({
    title: "",
    description: "",
    videoUrl: "",
    thumbnailUrl: "",
    track: "تحفيظ",
    level: "عام",
    teacherName: "",
    isLive: false,
    published: true,
  });

  // Teacher Profile Modals & Forms
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherProfile | null>(null);
  const [teacherForm, setTeacherForm] = useState({
    name: "",
    photoUrl: "",
    specialty: "قراءات وتجويد",
    ijazahs: "",
    bio: "",
    linkedUsername: "",
    displayOrder: 1,
    published: true,
  });

  const [formLoading, setFormLoading] = useState(false);
  const { showToast } = useToast();

  async function loadData() {
    setLoading(true);
    try {
      if (tab === "blog") {
        const data = await blogApi.adminAll();
        setPosts(data);
      } else if (tab === "media") {
        const data = await mediaApi.adminAll();
        setMediaList(data);
      } else {
        const data = await teacherProfilesApi.adminAll();
        setTeacherProfiles(data);
      }
    } catch {
      showToast("تعذّر تحميل المحتوى", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [tab]);

  // Blog Handlers
  async function handleSavePost(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (editingPost) {
        await blogApi.update(editingPost.id, postForm);
        showToast("تم تحديث المقال بنجاح", "success");
      } else {
        await blogApi.create(postForm);
        showToast("تمت إضافة المقال بنجاح", "success");
      }
      setShowAddPostModal(false);
      setEditingPost(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || "تعذّر حفظ المقال", "error");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDeletePost(id: string) {
    if (!window.confirm("هل أنت متأكد من حذف هذا المقال؟")) return;
    try {
      await blogApi.remove(id);
      showToast("تم حذف المقال", "success");
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      showToast("تعذّر حذف المقال", "error");
    }
  }

  // Media Handlers
  async function handleSaveMedia(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (editingMedia) {
        await mediaApi.update(editingMedia.id, mediaForm);
        showToast("تم تحديث عنصر الوسائط", "success");
      } else {
        await mediaApi.create(mediaForm);
        showToast("تمت إضافة عنصر الوسائط بنجاح", "success");
      }
      setShowAddMediaModal(false);
      setEditingMedia(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || "تعذّر حفظ الوسائط", "error");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDeleteMedia(id: string) {
    if (!window.confirm("هل أنت متأكد من حذف هذا الفيديو؟")) return;
    try {
      await mediaApi.remove(id);
      showToast("تم حذف الفيديو", "success");
      setMediaList((prev) => prev.filter((m) => m.id !== id));
    } catch {
      showToast("تعذّر الحذف", "error");
    }
  }

  // Teacher Handlers
  async function handleSaveTeacher(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    try {
      const ijazahsArr = teacherForm.ijazahs
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (editingTeacher) {
        await teacherProfilesApi.update(editingTeacher.id, {
          ...teacherForm,
          ijazahs: ijazahsArr,
        });
        showToast("تم تحديث بروفايل المعلم", "success");
      } else {
        await teacherProfilesApi.create({
          ...teacherForm,
          ijazahs: ijazahsArr,
        });
        showToast("تمت إضافة بروفايل المعلم بنجاح", "success");
      }
      setShowAddTeacherModal(false);
      setEditingTeacher(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || "تعذّر حفظ بروفايل المعلم", "error");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDeleteTeacher(id: string) {
    if (!window.confirm("هل أنت متأكد من حذف هذا المعلم من صفحة الموقع؟")) return;
    try {
      await teacherProfilesApi.remove(id);
      showToast("تم حذف البروفايل", "success");
      setTeacherProfiles((prev) => prev.filter((t) => t.id !== id));
    } catch {
      showToast("تعذّر الحذف", "error");
    }
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">إدارة المحتوى والموقع</h1>
          <p className="text-ink-mute text-sm mt-1">
            إدارة مقالات المدونة، مكتبة الفيديوهات والبث المباشر، والمعلمين المعروضين في الموقع
          </p>
        </div>

        <Button
          onClick={() => {
            if (tab === "blog") {
              setEditingPost(null);
              setPostForm({
                title: "",
                content: "",
                excerpt: "",
                category: "فوائد قرآنية",
                author: "إدارة المدرسة",
                coverImage: "",
                published: true,
              });
              setShowAddPostModal(true);
            } else if (tab === "media") {
              setEditingMedia(null);
              setMediaForm({
                title: "",
                description: "",
                videoUrl: "",
                thumbnailUrl: "",
                track: "تحفيظ",
                level: "عام",
                teacherName: "",
                isLive: false,
                published: true,
              });
              setShowAddMediaModal(true);
            } else {
              setEditingTeacher(null);
              setTeacherForm({
                name: "",
                photoUrl: "",
                specialty: "قراءات وتجويد",
                ijazahs: "",
                bio: "",
                linkedUsername: "",
                displayOrder: 1,
                published: true,
              });
              setShowAddTeacherModal(true);
            }
          }}
          className="flex items-center gap-2"
        >
          <Plus size={17} />
          <span>
            {tab === "blog"
              ? "مقال جديد"
              : tab === "media"
              ? "فيديو/بث جديد"
              : "بروفايل معلم جديد"}
          </span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-line gap-2">
        <button
          onClick={() => setTab("blog")}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm transition-colors border-b-2 -mb-px ${
            tab === "blog"
              ? "border-brand text-brand-ink"
              : "border-transparent text-ink-mute hover:text-ink"
          }`}
        >
          <FileText size={18} />
          <span>مقالات المدونة ({posts.length})</span>
        </button>

        <button
          onClick={() => setTab("media")}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm transition-colors border-b-2 -mb-px ${
            tab === "media"
              ? "border-brand text-brand-ink"
              : "border-transparent text-ink-mute hover:text-ink"
          }`}
        >
          <Video size={18} />
          <span>مكتبة الفيديوهات ({mediaList.length})</span>
        </button>

        <button
          onClick={() => setTab("teachers")}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm transition-colors border-b-2 -mb-px ${
            tab === "teachers"
              ? "border-brand text-brand-ink"
              : "border-transparent text-ink-mute hover:text-ink"
          }`}
        >
          <UserCheck size={18} />
          <span>بروفايلات المعلمين بالموقع ({teacherProfiles.length})</span>
        </button>
      </div>

      {loading ? (
        <Loader size="lg" />
      ) : tab === "blog" ? (
        /* قائمة المقالات */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {posts.map((post) => (
            <div
              key={post.id}
              className="card !rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-brand-ink bg-brand-soft px-2.5 py-1 rounded-lg">
                    {post.category}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-bold ${
                      post.published ? "text-brand-ink" : "text-ink-mute"
                    }`}
                  >
                    {post.published ? <Eye size={13} /> : <EyeOff size={13} />}
                    {post.published ? "منشور" : "مسودة"}
                  </span>
                </div>
                <h3 className="font-extrabold text-base text-ink line-clamp-2 mt-2">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="text-xs text-ink-mute line-clamp-3 mt-1.5 leading-relaxed">
                    {post.excerpt}
                  </p>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-line flex items-center justify-between">
                <span className="text-xs text-ink-mute font-bold">{post.author}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingPost(post);
                      setPostForm({
                        title: post.title,
                        content: post.content,
                        excerpt: post.excerpt || "",
                        category: post.category,
                        author: post.author,
                        coverImage: post.cover_image || "",
                        published: post.published,
                      });
                      setShowAddPostModal(true);
                    }}
                    className="icon-btn rounded-lg text-ink-mute hover:text-brand-ink"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="icon-btn rounded-lg text-ink-mute hover:text-danger-ink"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : tab === "media" ? (
        /* قائمة الوسائط */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {mediaList.map((m) => (
            <div
              key={m.id}
              className="card !rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gold-ink bg-gold-soft px-2.5 py-1 rounded-lg">
                    {m.track}
                  </span>
                  {m.is_live && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-danger-solid">
                      <Radio size={12} /> بث مباشر
                    </span>
                  )}
                </div>
                <h3 className="font-extrabold text-base text-ink line-clamp-2 mt-2">{m.title}</h3>
                {m.teacher_name && (
                  <p className="text-xs text-brand-ink font-semibold mt-1">{m.teacher_name}</p>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-line flex items-center justify-between">
                <span className="text-xs text-ink-mute font-mono truncate max-w-44">
                  {m.video_url}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingMedia(m);
                      setMediaForm({
                        title: m.title,
                        description: m.description || "",
                        videoUrl: m.video_url,
                        thumbnailUrl: m.thumbnail_url || "",
                        track: m.track,
                        level: m.level || "عام",
                        teacherName: m.teacher_name || "",
                        isLive: m.is_live,
                        published: m.published,
                      });
                      setShowAddMediaModal(true);
                    }}
                    className="icon-btn rounded-lg text-ink-mute hover:text-brand-ink"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleDeleteMedia(m.id)}
                    className="icon-btn rounded-lg text-ink-mute hover:text-danger-ink"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* قائمة ملفات المعلمين */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {teacherProfiles.map((t) => (
            <div
              key={t.id}
              className="card !rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-extrabold text-lg text-ink">{t.name}</h3>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingTeacher(t);
                        setTeacherForm({
                          name: t.name,
                          photoUrl: t.photo_url || "",
                          specialty: t.specialty || "",
                          ijazahs: (t.ijazahs || []).join(", "),
                          bio: t.bio || "",
                          linkedUsername: t.linked_username || "",
                          displayOrder: t.display_order || 1,
                          published: t.published !== false,
                        });
                        setShowAddTeacherModal(true);
                      }}
                      className="icon-btn rounded-lg text-ink-mute hover:text-brand-ink"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteTeacher(t.id)}
                      className="icon-btn rounded-lg text-ink-mute hover:text-danger-ink"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <p className="text-xs font-bold text-brand-ink">{t.specialty}</p>

                {t.ijazahs?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {t.ijazahs.map((ij) => (
                      <span
                        key={ij}
                        className="inline-flex items-center gap-1 text-[10px] font-bold bg-gold-soft text-gold-ink px-2 py-0.5 rounded-full"
                      >
                        <Award size={10} /> {ij}
                      </span>
                    ))}
                  </div>
                )}

                {t.bio && (
                  <p className="text-xs text-ink-soft line-clamp-3 mt-3 leading-relaxed">
                    {t.bio}
                  </p>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-line flex items-center justify-between text-xs text-ink-mute">
                <span>ترتيب العرض: {t.display_order}</span>
                {t.linked_username && <span>حساب المعلم: {t.linked_username}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: إضافة / تعديل مقال */}
      {showAddPostModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl p-6 sm:p-8 max-w-xl w-full sh-float border border-line max-h-[90vh] overflow-y-auto">
            <h3 className="font-extrabold text-lg text-ink mb-4">
              {editingPost ? "تعديل المقال" : "إضافة مقال جديد"}
            </h3>
            <form onSubmit={handleSavePost} className="space-y-4">
              <div>
                <label className="field-label">عنوان المقال *</label>
                <input
                  required
                  value={postForm.title}
                  onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                  className="field"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="field-label">التصنيف *</label>
                  <select
                    value={postForm.category}
                    onChange={(e) => setPostForm({ ...postForm, category: e.target.value })}
                    className="field field-select text-sm"
                  >
                    <option value="فوائد قرآنية">فوائد قرآنية</option>
                    <option value="تجويد">تجويد</option>
                    <option value="تربية">تربية</option>
                    <option value="أخبار المدرسة">أخبار المدرسة</option>
                  </select>
                </div>
                <div>
                  <label className="field-label">الكاتب</label>
                  <input
                    value={postForm.author}
                    onChange={(e) => setPostForm({ ...postForm, author: e.target.value })}
                    className="field"
                  />
                </div>
              </div>

              <div>
                <label className="field-label">موجز المقال</label>
                <input
                  value={postForm.excerpt}
                  onChange={(e) => setPostForm({ ...postForm, excerpt: e.target.value })}
                  className="field"
                  placeholder="موجز قصير يظهر في صفحة المدونة الرئيسية"
                />
              </div>

              <div>
                <label className="field-label">رابط صورة الغلاف (اختياري)</label>
                <input
                  value={postForm.coverImage}
                  onChange={(e) => setPostForm({ ...postForm, coverImage: e.target.value })}
                  className="field font-mono text-xs"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="field-label">محتوى المقال الكامل *</label>
                <textarea
                  required
                  rows={6}
                  value={postForm.content}
                  onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                  className="field resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="publishedCheck"
                  checked={postForm.published}
                  onChange={(e) => setPostForm({ ...postForm, published: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="publishedCheck" className="text-xs font-bold text-ink cursor-pointer">
                  نشر المقال فورًا في الموقع
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-line">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setShowAddPostModal(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit" loading={formLoading}>
                  حفظ المقال
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: إضافة / تعديل وسائط */}
      {showAddMediaModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl p-6 sm:p-8 max-w-xl w-full sh-float border border-line max-h-[90vh] overflow-y-auto">
            <h3 className="font-extrabold text-lg text-ink mb-4">
              {editingMedia ? "تعديل عنصر الميديا" : "إضافة فيديو أو بث مباشر"}
            </h3>
            <form onSubmit={handleSaveMedia} className="space-y-4">
              <div>
                <label className="field-label">عنوان الفيديو *</label>
                <input
                  required
                  value={mediaForm.title}
                  onChange={(e) => setMediaForm({ ...mediaForm, title: e.target.value })}
                  className="field"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="field-label">المسار التعليمي *</label>
                  <select
                    value={mediaForm.track}
                    onChange={(e) => setMediaForm({ ...mediaForm, track: e.target.value })}
                    className="field field-select text-sm"
                  >
                    <option value="تحفيظ">تحفيظ</option>
                    <option value="تفسير وتجويد">تفسير وتجويد</option>
                    <option value="علوم شرعية">علوم شرعية</option>
                  </select>
                </div>
                <div>
                  <label className="field-label">اسم الشيخ / المعلم</label>
                  <input
                    value={mediaForm.teacherName}
                    onChange={(e) => setMediaForm({ ...mediaForm, teacherName: e.target.value })}
                    className="field"
                  />
                </div>
              </div>

              <div>
                <label className="field-label">رابط الفيديو (YouTube Embed / Direct URL) *</label>
                <input
                  required
                  value={mediaForm.videoUrl}
                  onChange={(e) => setMediaForm({ ...mediaForm, videoUrl: e.target.value })}
                  className="field font-mono text-xs"
                  placeholder="https://www.youtube.com/embed/..."
                />
              </div>

              <div>
                <label className="field-label">رابط الصورة المصغرة (Thumbnail URL)</label>
                <input
                  value={mediaForm.thumbnailUrl}
                  onChange={(e) => setMediaForm({ ...mediaForm, thumbnailUrl: e.target.value })}
                  className="field font-mono text-xs"
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mediaForm.isLive}
                    onChange={(e) => setMediaForm({ ...mediaForm, isLive: e.target.checked })}
                    className="rounded"
                  />
                  <span>وضع علامة &quot;بث مباشر&quot;</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mediaForm.published}
                    onChange={(e) => setMediaForm({ ...mediaForm, published: e.target.checked })}
                    className="rounded"
                  />
                  <span>مرئي في صفحة الميديا بالموقع</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-line">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setShowAddMediaModal(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit" loading={formLoading}>
                  حفظ
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: إضافة / تعديل بروفايل معلم */}
      {showAddTeacherModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl p-6 sm:p-8 max-w-xl w-full sh-float border border-line max-h-[90vh] overflow-y-auto">
            <h3 className="font-extrabold text-lg text-ink mb-4">
              {editingTeacher ? "تعديل بروفايل المعلم" : "إضافة بروفايل معلم بالموقع"}
            </h3>
            <form onSubmit={handleSaveTeacher} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="field-label">اسم المعلم الكامل *</label>
                  <input
                    required
                    value={teacherForm.name}
                    onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                    className="field"
                  />
                </div>
                <div>
                  <label className="field-label">التخصص *</label>
                  <input
                    required
                    value={teacherForm.specialty}
                    onChange={(e) =>
                      setTeacherForm({ ...teacherForm, specialty: e.target.value })
                    }
                    className="field"
                    placeholder="مثال: إجازة بالقراءات العشر"
                  />
                </div>
              </div>

              <div>
                <label className="field-label">الإجازات والشهادات (مفصولة بفواصل ,)</label>
                <input
                  value={teacherForm.ijazahs}
                  onChange={(e) => setTeacherForm({ ...teacherForm, ijazahs: e.target.value })}
                  className="field"
                  placeholder="حفص عن عاصم, شعبة عن عاصم, إجازة جزرية"
                />
              </div>

              <div>
                <label className="field-label">رابط صورة المعلم (اختياري)</label>
                <input
                  value={teacherForm.photoUrl}
                  onChange={(e) => setTeacherForm({ ...teacherForm, photoUrl: e.target.value })}
                  className="field font-mono text-xs"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="field-label">نبذة تعريفية</label>
                <textarea
                  rows={3}
                  value={teacherForm.bio}
                  onChange={(e) => setTeacherForm({ ...teacherForm, bio: e.target.value })}
                  className="field resize-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="field-label">اسم المستخدم المسجل بالنظام (اختياري)</label>
                  <input
                    value={teacherForm.linkedUsername}
                    onChange={(e) =>
                      setTeacherForm({ ...teacherForm, linkedUsername: e.target.value })
                    }
                    className="field font-mono text-xs"
                    placeholder="teacher_username"
                  />
                </div>
                <div>
                  <label className="field-label">ترتيب الظهور</label>
                  <input
                    type="number"
                    min={1}
                    value={teacherForm.displayOrder}
                    onChange={(e) =>
                      setTeacherForm({ ...teacherForm, displayOrder: Number(e.target.value) })
                    }
                    className="field font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-line">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setShowAddTeacherModal(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit" loading={formLoading}>
                  حفظ البروفايل
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
