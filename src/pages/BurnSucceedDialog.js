import React from "react";
import { Link, Button, Modal } from "flowbite-react";

const BurnSucceedDialog = ({ open, name, addr, amount, tx, handleClose }) => {
  return (
    <Modal onClose={handleClose} show={open} size="xl" popup>
      <Modal.Header />
      <Modal.Body>
        <div className="">
          <h3 className="text-3xl font-medium text-gray-900 dark:text-white">
            Hellcoin Received
          </h3>
          {/* <div className="mt-2">{i18next.t("freemint.successful.body") + amount + " $MING! "}</div> */}
          <div className="mt-8 text-sm font-bold">
            You just offered {amount} $HELL to {name} (address {addr}) in the underworld. May all the dead no longer suffer from hyperinflation.. 
          </div>
          {/* <div className="text-sm mt-4">
            我们会给燃烧一定数量的地址空投NFT，请持续关注我们的
            <a className="text-blue-500" href="https://twitter.com/ming_bi_xyz" target="_blank" rel="noopener noreferrer">官方推特</a>
          </div> */}

          <div className="w-full flex mt-6">
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => {
                handleClose();
              }}
            >
              Close
            </button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default BurnSucceedDialog;
