import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function generatePassword(length = 14) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#*";
  const array = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(array, (byte) => chars[byte % chars.length]).join("");
}

function getTransporter() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: Deno.env.get("SMTP_EMAIL")!,
      pass: Deno.env.get("SMTP_PASS")!,
    },
  });
}

async function sendEmail(toEmail, toName, password) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: "Taawoun <" + Deno.env.get("SMTP_EMAIL") + ">",
    to: toEmail,
    subject: "Votre compte association a ete cree",
    html: "<div style='font-family: Arial; max-width: 600px; margin: 0 auto;'><div style='background: linear-gradient(135deg, #2563EB, #7C3AED); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;'><h1 style='color: white; margin: 0;'>Bienvenue, " + toName + " !</h1></div><div style='background: #fff; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;'><p style='color: #374151;'>Votre compte a ete cree. Voici vos identifiants :</p><div style='background: #F0F9FF; border: 2px solid #BAE6FD; border-radius: 10px; padding: 20px; margin: 20px 0;'><p><strong>Email :</strong> " + toEmail + "</p><p><strong>Mot de passe :</strong> <code style='background: #DBEAFE; padding: 6px 12px; border-radius: 6px; font-size: 18px; color: #1E40AF; font-weight: 700;'>" + password + "</code></p></div><div style='background: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 14px;'><p style='color: #991B1B; margin: 0;'>Changez votre mot de passe des votre premiere connexion.</p></div></div></div>",
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json();

    if (body.resend_only === true) {
      const { data: users, error: listError } = await supabase.auth.admin.listUsers({ filters: { email: body.email } });
      if (listError || !users?.users?.length) throw new Error("Aucun compte trouve");
      const user = users.users[0];
      const newPassword = generatePassword();
      const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, { password: newPassword });
      if (updateError) throw new Error(updateError.message);
      const { data: profile } = await supabase.from("association_profiles").select("name").eq("id", user.id).single();
      await sendEmail(body.email, profile?.name || "", newPassword);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { email, password, name, logo_url, description, category, website_url, address, latitude, longitude } = body;
    if (!email || !name) throw new Error("email et name obligatoires");

    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    if (existingUsers?.users?.some((u) => u.email === email)) throw new Error("Email deja utilise");

    const finalPassword = password || generatePassword();
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email, password: finalPassword, email_confirm: true, user_metadata: { role: "association", name },
    });
    if (userError) throw new Error(userError.message);

    const uid = userData.user?.id;
    if (!uid) throw new Error("Erreur creation user");

    const { error: profileError } = await supabase.from("association_profiles").insert({
      id: uid, email, name, logo_url: logo_url || null, description: description || null,
      category: category || null, website_url: website_url || null, address: address || null,
      latitude: latitude || null, longitude: longitude || null, is_verified: false,
    });

    if (profileError) {
      await supabase.auth.admin.deleteUser(uid);
      throw new Error(profileError.message);
    }

    try {
      await sendEmail(email, name, finalPassword);
    } catch (emailErr) {
      return new Response(JSON.stringify({ success: true, user_id: uid, warning: "Compte cree mais email echoue" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true, user_id: uid }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
