import React from "react";
import { Link, Button, Modal } from "flowbite-react";
import Image from 'next/image';

const BurnSucceedDialog = ({ open, name, addr, amount, tx, handleClose }) => {
  return (
    <Modal onClose={handleClose} show={open} size="xl" popup>
      <Modal.Header />
      <Modal.Body>
        <div className="text-center">
          <div className="relative w-32 h-32 mx-auto mb-4">
            <Image
              src="/rip.png"
              alt="RIP"
              layout="fill"
              objectFit="contain"
              priority
            />
          </div>
          
          <h3 className="text-3xl font-medium text-gray-900 dark:text-white mb-4">
            R.I.P. {name}
          </h3>
          
          <div className="mt-4 text-sm font-bold text-gray-500 dark:text-gray-300">
            You just burnt {amount} $HELL to {name} in the underworld. 
            <div className="mt-2 text-xs text-gray-400 break-all">
              <a href={`https://solscan.io/address/${addr}`} target="_blank" rel="noopener noreferrer">
              (address: {addr})
              </a>
            </div>
          </div>

          <div className="w-full flex justify-center mt-6">
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
