import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Heart, Trash2, Copy, FileDown, Plus, FolderHeart } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/templates")({
  component: () => (
    <AppLayout>
      <Templates />
    </AppLayout>
  ),
});

interface Tpl { id: string; title: string; content: string; category: string | null; is_favorite: boolean; created_at: string }
interface Gen { id: string; tool: string; output: string; is_favorite: boolean; created_at: string }

function Templates() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"templates" | "favorites">("templates");
  const [templates, setTemplates] = useState<Tpl[]>([]);
  const [favorites, setFavorites] = useState<Gen[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  const load = async () => {
    if (!user) return;
    const [t, f] = await Promise.all([
      supabase.from("saved_templates").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("generated_content").select("id, tool, output, is_favorite, created_at").eq("user_id", user.id).eq("is_favorite", true).order("created_at", { ascending: false }),
    ]);
    setTemplates(t.data ?? []);
    setFavorites(f.data ?? []);
  };

  useEffect(() => { load(); }, [user]); // eslint-disable-line

  const addTemplate = async () => {
    if (!user || !newTitle.trim() || !newContent.trim()) return;
    await supabase.from("saved_templates").insert({ user_id: user.id, title: newTitle, content: newContent, category: "user" });
    setNewTitle(""); setNewContent(""); setShowNew(false);
    toast.success("تم الحفظ"); load();
  };

  const deleteTemplate = async (id: string) => {
    await supabase.from("saved_templates").delete().eq("id", id);
    toast.success("تم الحذف"); load();
  };

  const removeFav = async (id: string) => {
    await supabase.from("generated_content").update({ is_favorite: false }).eq("id", id);
    load();
  };

  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success("نُسخ"); };
  const download = (title: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${title}.txt`; a.click();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FolderHeart className="h-6 w-6 text-primary" /> قوالبي والمفضلة</h1>
          <p className="text-sm text-muted-foreground">احفظ وأعد استخدام أفضل صياغاتك</p>
        </div>
        <Button onClick={() => setShowNew((v) => !v)} className="gap-2"><Plus className="h-4 w-4" /> قالب جديد</Button>
      </div>

      {showNew && (
        <div className="space-y-3 rounded-2xl border bg-card p-5">
          <div className="space-y-1.5"><Label>العنوان</Label><Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="اسم القالب" /></div>
          <div className="space-y-1.5"><Label>المحتوى</Label><Textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} rows={5} /></div>
          <div className="flex gap-2"><Button onClick={addTemplate}>حفظ</Button><Button variant="outline" onClick={() => setShowNew(false)}>إلغاء</Button></div>
        </div>
      )}

      <div className="flex gap-2 border-b">
        <button onClick={() => setTab("templates")} className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${tab === "templates" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>قوالبي ({templates.length})</button>
        <button onClick={() => setTab("favorites")} className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${tab === "favorites" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>المفضلة ({favorites.length})</button>
      </div>

      {tab === "templates" ? (
        <div className="space-y-3">
          {templates.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">لا توجد قوالب بعد</div>
          ) : templates.map((t) => (
            <div key={t.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold">{t.title}</h3>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => copy(t.content)}><Copy className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => download(t.title, t.content)}><FileDown className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteTemplate(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground line-clamp-4">{t.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {favorites.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">لا توجد مفضلة بعد</div>
          ) : favorites.map((f) => (
            <div key={f.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-primary">{f.tool}</span>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => copy(f.output)}><Copy className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => removeFav(f.id)}><Heart className="h-4 w-4 fill-current text-destructive" /></Button>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm line-clamp-4">{f.output}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
