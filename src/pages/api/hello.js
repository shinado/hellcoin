import { BN } from "@project-serum/anchor";
import {
  Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  sendAndConfirmTransaction,
  TransactionInstruction,
  // LAMPORTS_PER_SOL
} from "@solana/web3.js";
import {
  Token,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createTransferInstruction,
} from "@solana/spl-token";

export default function handler(req, res) {
  const { senderAddress, recipientAddress, mintAddress, amount } = req.body;
  const netWork = "http://solscan.rpcpool.com"; //主网
  const connection = new Connection(netWork, "recent");

  const decimals = 10000000;
  const mint = new PublicKey(mintAddress);
  const fromPubkey = new PublicKey(senderAddress); // 转出的钱包地址
  const toPubkey = new PublicKey(recipientAddress); // 转入钱包地址

  // 获取代币地址
  const destinationAssociatedTokenAddress = getAssociatedTokenAddress(
    mint, // 代币mint地址
    fromPubkey // 账户地址
  );

  // 查询代币，没有就创建代币  Token.createAssociatedTokenAccountInstruction
  const destination = connection.getAccountInfo(
    destinationAssociatedTokenAddress
  );

  // console.log(destination, 'destination', destinationAssociatedTokenAddress)
  const tx = new Transaction(); // 建一个交易单

  if (!destination) {
    // 给转入地址创建一个代币token
    const associatedTokenAccountIx = tx.add(
      Token.createAssociatedTokenAccountInstruction(
        destinationAssociatedTokenAddress,
        new PublicKey(fromPubkey), // 付款账户地址
        new PublicKey(toPubkey), // 转入地址
        new PublicKey(mint) // 代币地址
      )
    );
    tx.add(associatedTokenAccountIx); // 插入创建代币指令
    console.log(tx, "创建token账户 ");
  }

  // 创建交易单采用底层逻辑
  const splTransferIx = createTransferInstruction({
    programId: TOKEN_PROGRAM_ID,
    source: new PublicKey(mintAddress), // 代币账户地址
    destination: destinationAssociatedTokenAddress, // 查询的代币账户地址
    owner: new PublicKey(fromPubkey), // 所属人new PublicKey(puk)发送方的钱包地址
    amount: new BN(amount * decimals),
  });
  tx.add(splTransferIx);
  // 查找最近的区块
  tx.recentBlockhash = this.connection.getLatestBlockhash("max").blockhash;
  tx.feePayer = fromPubkey; // 付款人
  // 调用slope钱包获取签名
  const slope = new window.Slope();
  const { msg, data } = slope.signTransaction(
    bs58.encode(tx.serializeMessage())
  );
  if (msg === "ok") {
    // 给交易设置slope钱包签名
    tx.addSignature(fromPubkey, bs58.decode(data.signature));
    const txid = this.connection.sendRawTransaction(
      tx.serialize(),
      bs58.decode(data.signature),
      {
        skipPreflight: false,
        preflightCommitment: "recent",
      }
    );

    console.log(txid); // 交易成功返回签名地址可在查询记录
    let err = this.confirmTx(txid);
    err && (err = this.confirmTx(txid));

    if (err) {
      res.status(500).json({ err });
    } else {
      res.status(200).json({ txid });
    }
  }
}
