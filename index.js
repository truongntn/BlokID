const http = require("http");
const hostname = "127.0.0.1";
const port = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");
  res.end("Hello World");
});

async function sendToTestnest(input) {
  const { createHash } = await import("node:crypto");
  console.log(createHash("sha256").update(input).digest("hex"));

  const { struct, u32, ns64 } = require("@solana/buffer-layout");
  const { Buffer } = require("buffer");
  const web3 = require("@solana/web3.js");

  //generate a new Keypair
  let keypair = web3.Keypair.generate();
  let payer = web3.Keypair.generate();

  //connect to testnet
  let connection = new web3.Connection(web3.clusterApiUrl("testnet"));

  let airdropSignature = await connection.requestAirdrop(
    payer.publicKey,
    web3.LAMPORTS_PER_SOL
  );

  await connection.confirmTransaction({ signature: airdropSignature });

  let allocateTransaction = new web3.Transaction({
    feePayer: payer.publicKey,
  });
  let keys = [{ pubkey: keypair.publicKey, isSigner: true, isWritable: true }];
  let params = { space: 10 };

  //allocate struct
  let allocateStruct = {
    index: 8,
    layout: struct([u32("instruction"), ns64("space")]),
  };

  //allocate a data buffer
  let data = Buffer.alloc(allocateStruct.layout.span);
  let layoutFields = Object.assign(
    { instruction: allocateStruct.index },
    params
  );
  allocateStruct.layout.encode(layoutFields, data);

  allocateTransaction.add(
    new web3.TransactionInstruction({
      keys,
      programId: web3.SystemProgram.programId,
      data,
    })
  );

  let result = await web3.sendAndConfirmTransaction(
    connection,
    allocateTransaction,
    [payer, keypair]
  );
  console.log(
    "https://explorer.solana.com/tx/" + result + "?cluster=testnet#ix-1"
  );
}

const { program } = require("commander");

//get parameter from command line
program.description("BlokID Blockchain").option("--i");
program.showHelpAfterError();
program.allowUnknownOption();
program.parse();

const options = program.opts();
if (options.i) {
  sendToTestnest(program.args[0]);
} else console.log("Unknown option");
