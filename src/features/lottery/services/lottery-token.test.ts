import { generateLotteryToken } from "./lottery-token";

describe("generateLotteryToken", () => {
  const originalSecret = process.env.LOTTERY_TOKEN_SECRET;

  afterEach(() => {
    process.env.LOTTERY_TOKEN_SECRET = originalSecret;
  });

  test("同じuserIdなら常に同じトークンになる", () => {
    process.env.LOTTERY_TOKEN_SECRET = "test-secret";
    const userId = "11111111-1111-1111-1111-111111111111";
    expect(generateLotteryToken(userId)).toBe(generateLotteryToken(userId));
  });

  test("userIdが違えばトークンも変わる", () => {
    process.env.LOTTERY_TOKEN_SECRET = "test-secret";
    const tokenA = generateLotteryToken("11111111-1111-1111-1111-111111111111");
    const tokenB = generateLotteryToken("22222222-2222-2222-2222-222222222222");
    expect(tokenA).not.toBe(tokenB);
  });

  test("シークレット未設定ならnullを返す（ページを落とさない）", () => {
    process.env.LOTTERY_TOKEN_SECRET = "";
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    expect(generateLotteryToken("user-1")).toBeNull();
    consoleErrorSpy.mockRestore();
  });
});
