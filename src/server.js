import express from "express";
import CryptoJS from "crypto-js";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const createMac = (req, res) => {
  try {
    const { body } = req;
    const dataMac = Object.keys(body)
      .sort()
      .map(
        (key) =>
          `${key}=${
            typeof body[key] === "object"
              ? JSON.stringify(body[key])
              : body[key]
          }`
      )
      .join("&");

    const mac = CryptoJS.HmacSHA256(
      dataMac,
      process.env.ZALO_CHECKOUT_SECRET_KEY1
    ).toString();

    res.json({ mac });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const zaloNotify = async (res, req) => {
  console.log(req.body);
  try {
    const { data, mac } = req.body || {};
    if (!data || !mac) {
      return {
        status_code: 0,
        message: "Missing data or mac",
      };
    }
    const { method, orderId, appId } = data;

    if (!method || !orderId || !appId) {
      return {
        returnCode: 0,
        returnMessage: "Missing method or orderId or appId",
      };
    }
    const str = `appId=${appId}&orderId=${orderId}&method=${method}`;

    const reqMac = CryptoJS.HmacSHA256(
      str,
      process.env.ZALO_CHECKOUT_SECRET_KEY
    ).toString();

    if (reqMac == mac) {
      return res.json({ status_code: 1, message: "Successfully", reqMac });
    } else {
      return {
        status_code: 0,
        message: "Fail",
        reqMac,
      };
    }
  } catch (error) {
    console.log(error);
  }
};
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.post("/create-mac", createMac);
app.post("/zalo-notify", zaloNotify);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
