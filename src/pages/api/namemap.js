import dbConnect from '../../utils/dbConnect';
import NameMap from '../../models/NameMap';

export default async function handler(req, res) {
  await dbConnect();

  switch (req.method) {
    case 'GET':
      try {
        const { address } = req.query;
        const nameMaps = await NameMap.find({ address: address });
        res.status(200).json(nameMaps);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch name maps' });
      }
      break;

    case 'POST':
      try {
        const { name, address } = req.body;
        console.log("name:", name);
        console.log("address:", address);
        const exists = await NameMap.exists({ address: address });
        if (exists) {
          res.status(200).json({ message: 'Name map already exists' });
          return;
        }else{
          const nameMap = await NameMap.create({ name, address });
          res.status(201).json(nameMap);
        }
      } catch (error) {
        res.status(500).json({ error: 'Failed to create name map' });
      }
      break;

    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
} 