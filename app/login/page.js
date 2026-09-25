"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, GraduationCap, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setError(""); setMessage(""); setLoading(true);
    const supabase = createClient();
    if (mode === "login") {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) setError("تعذر تسجيل الدخول. تحقق من البريد الإلكتروني وكلمة المرور.");
      else window.location.assign("/");
    } else {
      const { error: authError } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/auth/callback?next=/` } });
      if (authError) {
        const known = authError.message.includes("Password") ? "كلمة المرور يجب أن تتكون من 6 أحرف على الأقل." : authError.message.includes("already registered") ? "هذا البريد مسجل مسبقًا. جرّب تسجيل الدخول بدلًا من ذلك." : `تعذر إنشاء الحساب: ${authError.message}`;
        setError(known);
      }
      else setMessage("تم إنشاء الحساب. راجع بريدك الإلكتروني لتأكيده، ثم سجّل الدخول.");
    }
    setLoading(false);
  };
  return <main className="auth-page"><div className="auth-art"><Link className="brand" href="/"><span className="brand-mark"><GraduationCap size={23}/></span><span>مكتبة <b>القسم</b></span></Link><div className="auth-art-copy"><span>مساحتك الدراسية</span><h1>رتّب تعلّمك<br/>واحتفظ بكل ما تحتاجه.</h1><p>أنشئ حسابًا لرفع المحتوى، متابعة حالة مساهماتك، والوصول إلى تجربتك الدراسية.</p></div><div className="auth-benefits"><p><CheckCircle2/> ارفع ملفاتك بأمان</p><p><CheckCircle2/> تابع حالة كل مساهمة</p><p><CheckCircle2/> ساهم في معرفة القسم</p></div></div><section className="auth-card-wrap"><Link href="/" className="back-home"><ArrowRight size={17}/> العودة إلى المكتبة</Link><div className="auth-card"><div className="auth-tabs"><button className={mode === "login" ? "selected" : ""} onClick={() => {setMode("login");setError("");setMessage("")}}>تسجيل الدخول</button><button className={mode === "signup" ? "selected" : ""} onClick={() => {setMode("signup");setError("");setMessage("")}}>إنشاء حساب</button></div><h2>{mode === "login" ? "مرحبًا بعودتك" : "ابدأ رحلتك معنا"}</h2><p className="auth-intro">{mode === "login" ? "أدخل بياناتك للوصول إلى حسابك." : "أنشئ حسابًا للمساهمة في مكتبة القسم."}</p><form onSubmit={submit}>{mode === "signup" && <label>الاسم الكامل<input value={fullName} required onChange={e => setFullName(e.target.value)} placeholder="مثال: يوسف محمد" /></label>}<label>البريد الإلكتروني<span className="input-wrap"><Mail size={18}/><input value={email} type="email" required dir="ltr" onChange={e => setEmail(e.target.value)} placeholder="name@example.com" /></span></label><label>كلمة المرور<span className="input-wrap"><LockKeyhole size={18}/><input value={password} type="password" required minLength="6" dir="ltr" onChange={e => setPassword(e.target.value)} placeholder="6 أحرف على الأقل" /></span></label>{error && <p className="auth-error">{error}</p>}{message && <p className="auth-success">{message}</p>}<button className="auth-submit" disabled={loading}>{loading ? <LoaderCircle className="spin" size={19}/> : null}{mode === "login" ? "تسجيل الدخول" : "إنشاء الحساب"}</button></form>{mode === "login" && <button className="forgot" onClick={() => setMessage("سيتم توفير استعادة كلمة المرور من صفحة مستقلة قريبًا.")}>هل نسيت كلمة المرور؟</button>}</div></section></main>;
}
