import { connectWebSocketClient } from "@stacks/blockchain-api-client";

import { MicroDAO } from "../schemas/micro-dao";

export const listenToSocket = async () => {
  const socket = await connectWebSocketClient(process.env.REACT_APP_STACKS_URL);
  socket.subscribeMempool((event) => {
    if (event.tx_type === "smart_contract") {
      const contract = event.smart_contract;
      const matchesMicroDAO = /;; micro-dao/g.test(contract.source_code);

      if (matchesMicroDAO) {
        console.log("micro-dao deployed", event.smart_contract.contract_id);
        socket.subscribeTxUpdates(event.tx_id, (update) => {
          if (update.tx_status === "success") {
            MicroDAO.find(
              { name: contract.contract_id.split(".")[1] },
              async (err, [dao]) => {
                // if not found or dao has an address already don't bother updating
                if (err || dao.contractAddress) {
                  console.log(err);
                  return;
                }
                dao.contractAddress = contract.contract_id;
                dao.save();
              }
            );
          }
        });
      }
    }
  });
};
