import { openContractCall } from "@stacks/connect-react";
import { StacksMainnet } from "@stacks/network";
import {
  createSTXPostCondition,
  FungibleConditionCode,
  uintCV,
} from "@stacks/transactions";
import React, { useEffect, useState } from "react";
import { useCallback } from "react";
import Button from "react-bootstrap/esm/Button";
import { useParams } from "react-router-dom";
import { userSession } from "../constants/stacks-session";
import { NamesApi } from "@stacks/blockchain-api-client";

export const useDeployerName = (contractAddress?: string) => {
  const [deployerName, setDeployerName] = useState<string>();

  const loadDeployerName = useCallback(async () => {
    if (contractAddress) {
      const [address] = contractAddress.split(".");
      const api = new NamesApi();
      const namesOwnedByDeployer = (
        await api.getNamesOwnedByAddress({
          address,
          blockchain: "stacks",
        })
      ).names;
      if (namesOwnedByDeployer) {
        setDeployerName(namesOwnedByDeployer[0]);
      }
    }
  }, [contractAddress]);

  useEffect(() => {
    loadDeployerName();
  }, [loadDeployerName]);

  return deployerName;
};

const MicroDAODepositView: React.FC = () => {
  const { contractAddress, amount } = useParams<{
    contractAddress: string;
    amount: string;
  }>();

  const [txId, setTxId] = useState("");
  const deployerName = useDeployerName(contractAddress);

  const deposit = useCallback(async () => {
    if (contractAddress && amount) {
      const [address, name] = contractAddress.split(".");
      const userAddress = userSession.loadUserData().profile.stxAddress.mainnet;
      openContractCall({
        contractAddress: address,
        contractName: name,
        functionName: "deposit",
        functionArgs: [uintCV(amount)],
        network: new StacksMainnet(),
        onFinish(data) {
          setTxId(data.txId);
        },
        postConditions: [
          createSTXPostCondition(
            userAddress,
            FungibleConditionCode.Equal,
            amount
          ),
        ],
      });
    }
  }, [contractAddress, amount]);

  return contractAddress ? (
    <div className="App">
      <header className="App-header">
        <p>
          DAO name: {deployerName}.{contractAddress.split(".")[1]}
        </p>
        <p>Deposit Amount: {Number(amount) / 1e6} STX</p>
        {txId ? (
          <Button
            href={`https://explorer.stacks.co/txid/${txId}?chain=mainnet`}
            variant={"link"}
            size="lg"
          >
            Check the deposit tx here!
          </Button>
        ) : (
          <Button onClick={deposit} size="lg" variant="primary">
            Deposit
          </Button>
        )}
      </header>
    </div>
  ) : (
    <p>please provide a valid contract address id</p>
  );
};

export default MicroDAODepositView;
