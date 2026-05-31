const { Auth } = require("@auth/core");
const Apple = require("@auth/core/providers/apple").default;
const Google = require("@auth/core/providers/google").default;

try {
  Auth(new Request("http://localhost:3000/api/auth/providers"), {
    secret: "my_super_secret_for_next_auth_needs_to_be_32_chars",
    trustHost: true,
    providers: [
      Google({ clientId: "valid", clientSecret: "valid" }),
      Apple({ clientId: "", clientSecret: "" })
    ]
  }).then(res => console.log(res.status)).catch(e => console.log("Catch:", e));
} catch(e) {
  console.log("Error:", e);
}
