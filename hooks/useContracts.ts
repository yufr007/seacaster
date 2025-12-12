import { useWriteContract, useWaitForTransactionReceipt, useAccount, usePublicClient } from 'wagmi';
import { SEASON_PASS_ABI, TOURNAMENT_POOL_ABI, ERC20_ABI, CONTRACT_ADDRESSES } from '../contracts/abis';
import { parseUnits } from 'viem';

export const useContracts = () => {
  const { isConnected, address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const publicClient = usePublicClient();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Generic ERC20 Approval Helper
  const approveUSDC = async (spender: `0x${string}`, amount: bigint) => {
    if (!address || !publicClient) return;

    // Check allowance
    // Cast to any to bypass strict viem type inference issues with authorizationList
    const allowance = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.USDC as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [address, spender],
    } as any) as unknown as bigint;

    if (allowance < amount) {
      writeContract({
        address: CONTRACT_ADDRESSES.USDC as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spender, amount],
        account: address,
        chain: undefined,
      });
      throw new Error("Approval Request Sent. Please confirm transaction and try again.");
    }
  };

  // Season Pass Purchase (USDC)
  const buySeasonPass = async () => {
    if (!isConnected || !address) throw new Error("Wallet not connected");

    // const price = parseUnits('9.99', 6); // USDC has 6 decimals

    try {
      // In a real flow, verify allowance first
      // await approveUSDC(CONTRACT_ADDRESSES.SEASON_PASS as `0x${string}`, price);

      writeContract({
        address: CONTRACT_ADDRESSES.SEASON_PASS as `0x${string}`,
        abi: SEASON_PASS_ABI,
        functionName: 'purchasePass',
        args: [],  // Contract takes no arguments - USDC transfer handled internally
        account: address,
        chain: undefined,
      });
    } catch (e: any) {
      console.error(e);
      throw e;
    }
  };

  // Verify Ownership (Read Call)
  const checkSeasonPass = async (userAddress: `0x${string}`): Promise<boolean> => {
    if (!publicClient) return false;
    try {
      const hasPass = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.SEASON_PASS as `0x${string}`,
        abi: SEASON_PASS_ABI,
        functionName: 'hasActivePass',
        args: [userAddress]
      } as any);
      return hasPass as boolean;
    } catch (e) {
      console.warn("Failed to check season pass on-chain", e);
      return false;
    }
  };

  // Tournament Entry (USDC)
  const enterTournament = async (tournamentId: string, fee: number) => {
    if (!isConnected || !address) throw new Error("Wallet not connected");

    // const feeAmount = parseUnits(fee.toString(), 6);

    try {
      // await approveUSDC(CONTRACT_ADDRESSES.TOURNAMENT as `0x${string}`, feeAmount);

      writeContract({
        address: CONTRACT_ADDRESSES.TOURNAMENT as `0x${string}`,
        abi: TOURNAMENT_POOL_ABI,
        functionName: 'enterTournament',
        args: [BigInt(tournamentId)],
        account: address,
        chain: undefined,
      });
    } catch (e: any) {
      console.error(e);
      throw e;
    }
  };

  return {
    buySeasonPass,
    checkSeasonPass,
    enterTournament,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    error
  };
};