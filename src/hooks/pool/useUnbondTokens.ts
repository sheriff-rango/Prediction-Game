import { useTokenInfo } from "hooks/tokens/useTokenInfo"
import { useMutation } from "@tanstack/react-query"
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil"
import { useChain } from "@cosmos-kit/react"
import { slippageState, tokenSwapState } from "state/swapState"
import { useRefetchQueries } from "hooks/useRefetchQueries"
import { WalletStatus } from "@cosmos-kit/core"
import { Id, toast } from "react-toastify"
import { convertDenomToMicroDenom } from "utils/tokens/helpers"
import { TokenStatus } from "utils/tokens/tokens"
import { tokenSwap } from "utils/swap/tokenSwap"
import { addLiquidityState } from "state/poolState"
import { addLiquidity } from "utils/pool/addLiquidity"
import { usePoolFromListQueryById } from "hooks/pool/usePoolList"
import { useParams } from "react-router-dom"
import { useRef } from "react"
import { removeLiquidity } from "utils/pool/removeLiquidity"
import { usePoolBalance } from "./usePoolBalance"
import { bondTokens } from "utils/pool/bondTokens"
import { useUnbondedLiquidity } from "./useUnbondedLiquidity"
import { unbondTokens } from "utils/pool/unbondTokens"

export const useUnbondTokens = ({
  bondAmount,
  stakingAddress
}: {
  bondAmount: number
  stakingAddress: string
}) => {
  const { getSigningCosmWasmClient, address, status } = useChain("juno")

  const parameters = useParams()
  const [pool, isLoading] = usePoolFromListQueryById({
    poolId: Number(parameters.slug!)
  })

  const toastId = useRef<Id>()

  const refetchQueries = useRefetchQueries([
    "tokenBalance",
    `@hopers/unbondedTokens/${pool?.liquidity.token1.denom}/${pool?.liquidity.token2.denom}`
  ])

  return useMutation(
    ["unbondTokens"],
    async () => {
      if (status !== WalletStatus.Connected) {
        throw new Error("Please connect your wallet.")
      }

      toastId.current = toast("Unbonding Tokens...", { autoClose: false })

      return await unbondTokens(
        address!,
        getSigningCosmWasmClient,
        bondAmount,
        stakingAddress
      )
    },
    {
      onSuccess() {
        toast.update(toastId.current!, {
          render: "Unbonded Tokens!",
          type: toast.TYPE.SUCCESS,
          autoClose: 5000
        })
        refetchQueries()
      },
      onError(e) {
        toast.update(toastId.current!, {
          type: toast.TYPE.ERROR,
          render: "Swap " + e,
          autoClose: 5000
        })
      }
      //   onSettled() {
      //     setTransactionState(TransactionStatus.IDLE)
      //   }
    }
  )
}
