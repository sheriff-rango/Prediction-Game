import {
  HStack,
  VStack,
  Heading,
  Avatar,
  Input,
  Flex,
  Spacer,
  Button,
  useColorModeValue,
  Text,
  Alert,
  AlertIcon
} from "@chakra-ui/react"
import { NumericFormat } from "react-number-format"
import {
  convertDenomToMicroDenom,
  convertMicroDenomToDenom
} from "utils/tokens/helpers"
import { TTokenListItem, TokenStatus, TokenType } from "utils/tokens/tokens"
import truncateAddress from "utils/ui/truncateAddress"
import { ExternalChain } from "./ExternalChain"
import { useChain } from "@cosmos-kit/react"
import { useTokenBalance } from "hooks/tokens/useTokenBalance"
import { useRecoilState } from "recoil"
import { externalChainInfoState, externalChainState } from "state/UIState"
import { useExternalBalance } from "hooks/tokens/useExternalBalance"
import { useEffect } from "react"
import { useIBCDeposit } from "hooks/ibc/useIBCDeposit"
import { ChainConfigs } from "utils/tokens/chains"
import { eToNumber } from "utils/evm/eToNumber"
import { FaArrowRight } from "react-icons/fa"

const Deposit = ({ token }: { token: TTokenListItem }) => {
  const { address, isWalletConnected, wallet } = useChain("juno")
  const [externalChain, setExternalChain] = useRecoilState(externalChainState)
  const [tokenBalance] = useExternalBalance(TokenStatus[token.token].denom!)
  const [externalChainInfo, setExternalChainInfo] = useRecoilState(
    externalChainInfoState
  )

  const { mutate: handleIbcDeposit, isLoading: isExecutingDeposit } =
    useIBCDeposit()

  return (
    <VStack align={"end"}>
      {externalChain === TokenType["HUAHUA"] && (
        <Alert status="warning" mb={6} rounded="1.25em">
          <AlertIcon />
          Chihuahua needs a higher gas fee than estimateable. Please increase
          your gas by 10,000 before trying to deposit.
        </Alert>
      )}

      <HStack w="full" justify="space-between" mb={6}>
        <ExternalChain
          externalChain={externalChain}
          wallet={wallet?.name!}
          type="deposit"
          denom={TokenStatus[token.token].denom!}
        />
        <VStack w="full">
          <Heading fontSize="20">To Junø</Heading>
          <Avatar src="/assets/listedTokens/ujuno.png" />
          <Input
            variant="unstyled"
            fontSize="md"
            fontWeight="bold"
            textAlign="center"
            _hover={{ _disabled: { cursor: "default" } }}
            defaultValue={truncateAddress(address, 10, 10)}
            w="full"
            rounded="1.25em"
            color="gray.800"
            px={2}
            py={1}
            minH="3rem"
            bg="white"
            _dark={{
              _focus: { bg: "gray.800", shadow: "md" },
              color: "white",
              bg: "gray.600"
            }}
            type="text"
            _focus={{
              border: "none",
              bg: "offwhite.2",
              shadow: "md"
            }}
          />
        </VStack>
      </HStack>
      <VStack align="start" w="full" mb={6}>
        <Flex w="full" justify="end" align="center" gap={2} pe={2}>
          <Text fontSize={{ base: "0.9em", md: "md" }} fontWeight="normal">
            Available on{" "}
            {ChainConfigs[TokenStatus[externalChain].chain].chainName}
          </Text>
          <Text
            fontSize={{ base: "0.9em", md: "md" }}
            fontWeight="900"
            color="brand.1"
          >
            {eToNumber(
              convertMicroDenomToDenom(
                tokenBalance,
                TokenStatus[token.token].decimal ?? 6
              )
            )}
          </Text>
          <Spacer />
          <HStack>
            <Button
              fontSize="sm"
              bg="offwhite.1"
              color="gray.800"
              _dark={{ color: "white", bg: "gray.600" }}
              _hover={{ filter: "brightness(110%)" }}
              _active={{ filter: "brightness(90%)" }}
              rounded={"0.8em"}
              shadow="md"
              transition="0.2s all"
              h={7}
              py={0}
              px={0}
              w={12}
              onClick={() => {
                setExternalChainInfo((external) => {
                  return {
                    ...external,
                    token: {
                      denom: TokenStatus[token.token].denom!,
                      amount: Math.ceil(Number(tokenBalance) / 2).toString()
                    }
                  }
                })
              }}
            >
              Half
            </Button>
            <Button
              rounded={"0.8em"}
              fontSize="sm"
              bg="offwhite.1"
              color="gray.800"
              _dark={{ color: "white", bg: "gray.600" }}
              _hover={{ filter: "brightness(110%)" }}
              _active={{ filter: "brightness(90%)" }}
              shadow="md"
              transition="0.2s all"
              h={7}
              py={0}
              px={0}
              w={12}
              onClick={() => {
                setExternalChainInfo((external) => {
                  return {
                    ...external,
                    token: {
                      denom: TokenStatus[token.token].denom!,
                      amount:
                        TokenStatus[token.token].decimal !== 18
                          ? Number(tokenBalance).toString()
                          : (Number(tokenBalance) - 150).toString()
                    }
                  }
                })
              }}
            >
              Max
            </Button>
          </HStack>
        </Flex>
        <NumericFormat
          defaultValue={
            convertMicroDenomToDenom(
              tokenBalance,
              TokenStatus[token.token].decimal ?? 6
            ) ?? 0
          }
          value={
            convertMicroDenomToDenom(
              externalChainInfo.token?.amount!,
              TokenStatus[token.token].decimal ?? 6
            ) ?? 0
          }
          valueIsNumericString
          decimalScale={TokenStatus[token.token].decimal ?? 6}
          allowNegative={false}
          thousandSeparator=","
          allowLeadingZeros={false}
          onValueChange={(values, sourceInfo) => {
            const { value } = values

            setExternalChainInfo((external) => {
              return {
                ...external,
                token: {
                  denom: TokenStatus[token.token].denom!,
                  amount: Math.floor(
                    Number(
                      convertDenomToMicroDenom(
                        value,
                        TokenStatus[token.token].decimal ?? 6
                      )
                    )
                  ).toString()
                }
              }
            })
          }}
          customInput={Input}
          variant="unstyled"
          fontSize={{ base: "lg", sm: "24" }}
          fontWeight="bold"
          textAlign="end"
          w="full"
          rounded="0.6em"
          color={useColorModeValue("gray.800", "white")}
          px={2}
          py={1}
          placeholder="0"
          // valueIsNumericString
          minH="3rem"
          bg="transparent"
          _dark={{ _focus: { bg: "gray.800" } }}
        />
      </VStack>
      <Button
        onClick={() => handleIbcDeposit()}
        rounded="1em"
        rightIcon={<FaArrowRight />}
        _hover={{ bgGradient: "linear(45deg, brand.1, brand.2)" }}
        bg="white"
        _dark={{
          bg: "gray.600",
          _hover: { bgGradient: "linear(45deg, brand.1, brand.2)" }
        }}
      >
        Deposit
      </Button>
    </VStack>
  )
}

export default Deposit
