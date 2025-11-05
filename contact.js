// contact.js
const form = document.getElementById('contactForm');
const statusEl = document.getElementById('formStatus');

// Toggle this if you later add Formspree/Netlify forms:
const USE_FORMSPREE = false; 
const FORMSPREE_ENDPOINT = "https://formspree.io/f/your-id"; // replace if using

function setError(id, msg){
  const el = document.querySelector(`.error[data-for="${id}"]`);
  if(el) el.textContent = msg || "";
}
function clearErrors(){ document.querySelectorAll('.error').forEach(e=> e.textContent = ""); }

function validate(data){
  clearErrors();
  let ok = true;
  if(!data.name.trim()){ setError("name", "Please enter your name."); ok = false; }
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)){ setError("email", "Please enter a valid email."); ok = false; }
  if(!data.message.trim()){ setError("message", "Please enter a message."); ok = false; }
  // Honeypot
  if(data.company && data.company.trim() !== ""){ ok = false; }
  return ok;
}

function toMailto({name, email, subject, message, sendCopy}){
  const to = "chamberspeter1@outlook.com";
  const subj = subject ? subject : `New message from ${name}`;
  const bodyLines = [
    `Name: ${name}`,
    `Email: ${email}`,
    "",
    message
  ];
  const body = encodeURIComponent(bodyLines.join("\n"));
  const target = `mailto:${to}?subject=${encodeURIComponent(subj)}&body=${body}${sendCopy ? `&cc=${encodeURIComponent(email)}` : ""}`;
  return target;
}

async function sendFormspree(payload){
  const res = await fetch(FORMSPREE_ENDPOINT, {
    method: "POST",
    headers: { "Accept":"application/json", "Content-Type":"application/json" },
    body: JSON.stringify(payload)
  });
  if(!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  statusEl.textContent = "";

  const data = {
    name: form.name.value || "",
    email: form.email.value || "",
    subject: form.subject.value || "",
    message: form.message.value || "",
    company: form.company.value || "", // honeypot
    sendCopy: document.getElementById('sendCopy').checked,
  };

  if(!validate(data)) return;

  try{
    if(USE_FORMSPREE){
      await sendFormspree({
        name: data.name,
        email: data.email,
        subject: data.subject || `New message from ${data.name}`,
        message: data.message
      });
      statusEl.textContent = "Thanks! Your message was sent.";
      form.reset();
    }else{
      // Mailto fallback: open the user's mail client prefilled
      const url = toMailto(data);
      window.location.href = url;
      statusEl.textContent = "Opening your email app...";
    }
  }catch(err){
    console.error(err);
    statusEl.textContent = "Sorry, there was a problem sending your message.";
  }
});
