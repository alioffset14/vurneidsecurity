const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI || "mongodb+srv://alioffsetDB:209628plm@alioffset.ncfv1so.mongodb.net"; 
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db("alioffsetDB");

    // Pastikan collections ada
    await db.createCollection("targets").catch(() => {});
    await db.createCollection("tests").catch(() => {});
    await db.createCollection("reports").catch(() => {});

    console.log("✅ Database & collections berhasil dibuat (tanpa data awal).");
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await client.close();
  }
}

run();
