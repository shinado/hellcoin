import React from "react";
import { Link, Button, Modal } from "flowbite-react";
import Image from 'next/image';

const DeadProfileDialog = ({ open, name, portrait, addr, amount, tx, handleClose }) => {
  return (
    <Modal onClose={handleClose} show={open} size="xl" popup>
      <Modal.Header />
      <Modal.Body>
        <div className="text-center">

        <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-gray-300">
            <Image
              src={portrait || "/default_portrait.png"}
              alt="RIP"
              layout="fill"
              objectFit="contain"
              priority
            />
          </div>

            {/* Name Text positioned below portrait */}
            <div className="mt-2 w-full text-center">
              <h3 className="text-xl text-white font-medium text-gray-900">
                R.I.P. {name}
              </h3>
            </div>
          
          <div className="mt-4 text-sm font-bold text-gray-500 dark:text-gray-300">
            You just burnt {amount} $HELL to <span className="text-red-500">{name}</span> in the underworld. 
            <div className="mt-2 text-xs text-gray-400 break-all">
              (address: {addr})
            </div>
            {/* <div className="mt-2">
              May all the dead no longer suffer from hyperinflation.
            </div> */}
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

export default DeadProfileDialog;
