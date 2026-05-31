const csrfRes = await fetch("http://localhost:3000/api/auth/csrf");
const { csrfToken } = await csrfRes.json();
const cookies = csrfRes.headers.get("set-cookie");

const res = await fetch("http://localhost:3000/api/auth/signin/google", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    "Cookie": cookies
  },
  body: new URLSearchParams({ csrfToken }).toString(),
  redirect: "manual"
});
console.log("Status:", res.status);
console.log("Headers:", Object.fromEntries(res.headers.entries()));
const text = await res.text();
console.log("Body:", text);
