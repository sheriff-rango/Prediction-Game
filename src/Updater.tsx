import { createContext, useEffect, useState, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { useChain } from "@cosmos-kit/react"
import { useRecoilState } from "recoil"
import { btcPriceState } from "state/btcPriceState"
import { balanceState, claimState, myGameListState } from "state/userInfo"
import {
    configState,
    currentTimeState,
    remainTimeState,
    roundsState
} from "state/roundsState"
import useContract from "hooks/useContract"
import {
    BackendUrl,
    FuzioOptionContract,
    ConnectedChain,
    FuzioContract
} from "./constants"

const FETCH_LIMIT = 10

interface IUpdater {
    refetchGameInfo: () => Promise<any>
    refetchBalance: () => Promise<any>
    refetchClaimStatus: () => void
    refreshAll: () => void
}

export const UdaterContext = createContext<IUpdater>({
    refetchGameInfo: () => new Promise(() => {}),
    refetchBalance: () => new Promise(() => {}),
    refetchClaimStatus: () => {},
    refreshAll: () => {}
})

export const Updater = ({ children }) => {
    const [, setBtcPrice] = useRecoilState(btcPriceState)
    const [, setRounds] = useRecoilState(roundsState)
    const [, setBalance] = useRecoilState(balanceState)
    const [config, setConfig] = useRecoilState(configState)
    const [, setCurrentTime] = useRecoilState(currentTimeState)
    const [, setClaimState] = useRecoilState(claimState)
    const [, setMyGameListState] = useRecoilState(myGameListState)
    // const [, setRemainTime] = useRecoilState(remainTimeState)
    const { runQuery, suggestToken } = useContract()

    const [fetchClaimStatusHandler, setFetchClaimStatusHandler] = useState(0)
    const [timeTicker, setTimeTicker] = useState(0)
    const [timeDiff, setTimeDiff] = useState(0)
    const { address } = useChain(ConnectedChain)
    // const [remainTimeResponse, setRemainTimeResponse] = useState({
    //     remain: 0,
    //     time: Number(new Date())
    // })

    useEffect(() => {
        // suggestToken("atlantic-2", FuzioContract)
        setInterval(() => {
            setTimeTicker((prev) => prev + 1)
        }, 500)
    }, [])

    useEffect(() => {
        if (!address) return
        ;(async () => {
            let result: any[] = []
            const fetchClaimStatus = async (startAfter?: any) => {
                const response = await runQuery(FuzioOptionContract, {
                    get_claim_info_by_user: {
                        player: address,
                        start_after: startAfter,
                        limit: FETCH_LIMIT
                    }
                })
                    .then((res) => res.claim_info)
                    .catch(() => [])
                result = [...result, ...response]
                if (response.length === FETCH_LIMIT) {
                    await fetchClaimStatus(response[FETCH_LIMIT - 1].round_id)
                }
            }
            await fetchClaimStatus()
            setClaimState(
                result.map((round) => ({
                    ...round,
                    round_id: Number(round.round_id)
                }))
            )
        })()
        ;(async () => {
            let result: any[] = []
            const fetchMyRounds = async (startAfter?: any) => {
                const response = await runQuery(FuzioOptionContract, {
                    my_game_list: {
                        player: address,
                        start_after: startAfter,
                        limit: FETCH_LIMIT
                    }
                })
                    .then((res) => res.my_game_list)
                    .catch(() => [])
                result = [...result, ...response]
                if (response.length === FETCH_LIMIT) {
                    await fetchMyRounds(response[FETCH_LIMIT - 1].round_id)
                }
            }
            await fetchMyRounds()
            setMyGameListState(
                result.map((round) => ({
                    ...round,
                    round_id: Number(round.round_id)
                }))
            )
        })()
    }, [address, fetchClaimStatusHandler])

    useEffect(() => {
        const now = Number(new Date())
        setCurrentTime(now - timeDiff)
    }, [timeTicker, timeDiff])

    const { getBalance } = useContract()

    const { data: gameInfo, refetch: refetchGameInfo } = useQuery({
        queryKey: ["gameInfo"],
        queryFn: () =>
            axios.get(`${BackendUrl}/game-info`).then((res) => res.data),
        refetchInterval: 1000 * 10
    })

    const { data: balanceResopnse, refetch: refetchBalance } = useQuery({
        queryKey: ["balance"],
        queryFn: () => getBalance(),
        refetchInterval: 1000
    })

    const { data: configResponse } = useQuery({
        queryKey: ["config"],
        queryFn: () =>
            axios.get(`${BackendUrl}/config`).then((res) => res.data),
        retry: true
    })

    useEffect(() => setConfig(configResponse?.config || {}), [configResponse])

    useEffect(() => {
        if (!gameInfo) return
        if (gameInfo.btcPrice) setBtcPrice(gameInfo.btcPrice)

        const now = Number(new Date())
        const currentTime = Number(gameInfo?.currentTime || now)
        setTimeDiff(now - currentTime)
        // setRemainTimeResponse({
        //     remain: Number(gameInfo?.remainTime)
        // })

        if (gameInfo.rounds?.length) {
            setRounds(
                (
                    gameInfo.rounds?.map((round) => {
                        const open_time = Number(round.open_time) / 1e6
                        const close_time = Number(round.close_time) / 1e6

                        return {
                            ...round,
                            id: Number(round.id),
                            bid_time: Number(round.bid_time) / 1e6,
                            open_time,
                            close_time,
                            bull_amount: Number(round.bull_amount),
                            bear_amount: Number(round.bear_amount),
                            current_time: currentTime
                        }
                    }) || []
                ).reverse()
            )
        }
    }, [gameInfo, configResponse])

    useEffect(() => {
        if (balanceResopnse && !isNaN(balanceResopnse))
            setBalance(balanceResopnse)
    }, [balanceResopnse])

    const refetchClaimStatus = () =>
        setFetchClaimStatusHandler((prev) => prev + 1)

    const refreshAll = useCallback(() => {
        refetchGameInfo()
        refetchBalance()
        refetchClaimStatus()
    }, [refetchGameInfo, refetchBalance, refetchClaimStatus])

    return (
        <UdaterContext.Provider
            value={{
                refetchGameInfo,
                refreshAll,
                refetchBalance,
                refetchClaimStatus
            }}
        >
            {children}
        </UdaterContext.Provider>
    )
}
