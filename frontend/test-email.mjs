const csrfRes = await fetch("http://localhost:3000/api/auth/csrf");
const { csrfToken } = await csrfRes.json();
const cookies = csrfRes.headers.get("set-cookie");

const res = await fetch("http://localhost:3000/api/auth/signin/nodemailer", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    "Cookie": cookies
  },
  body: new URLSearchParams({ csrfToken, email: "test@example.com" }).toString(),
  redirect: "manual"
});
console.log("Status:", res.status);
console.log("Location:", res.headers.get("location"));
