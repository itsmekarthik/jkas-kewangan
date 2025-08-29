import { sql } from '@vercel/postgres';
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      complainantName,
      complainantAddress,
      referenceNumber,
      email,
      phone,
      fax,
      complaintSource,
      complaintDate,
      receivedDate,
      complaintLocation,
      areaType,
      officerName,
      zone,
      parliament,
      monitoringDate,
      investigationReport,
      rootCause,
      actionTaken,
      followUpAction,
      latitude,
      longitude
    } = req.body;

    const config = {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      server: process.env.DB_SERVER,
      database: process.env.DB_NAME,
      options: {
        encrypt: true,
        trustServerCertificate: false
      }
    };

    const pool = await sql.connect(config);

    const result = await pool.request()
      .input('complainantName', sql.NVarChar, complainantName)
      .input('complainantAddress', sql.NVarChar, complainantAddress)
      .input('referenceNumber', sql.NVarChar, referenceNumber)
      .input('email', sql.NVarChar, email)
      .input('phone', sql.NVarChar, phone)
      .input('fax', sql.NVarChar, fax)
      .input('complaintSource', sql.NVarChar, complaintSource)
      .input('complaintDate', sql.Date, complaintDate)
      .input('receivedDate', sql.Date, receivedDate)
      .input('complaintLocation', sql.NVarChar, complaintLocation)
      .input('latitude', sql.Float, parseFloat(latitude))
      .input('longitude', sql.Float, parseFloat(longitude))
      .input('areaType', sql.NVarChar, areaType)
      .input('officerName', sql.NVarChar, officerName)
      .input('zone', sql.NVarChar, zone)
      .input('parliament', sql.NVarChar, parliament)
      .input('monitoringDate', sql.Date, monitoringDate)
      .input('investigationReport', sql.NVarChar, investigationReport)
      .input('rootCause', sql.NVarChar, rootCause)
      .input('actionTaken', sql.NVarChar, actionTaken)
      .input('followUpAction', sql.NVarChar, followUpAction)
      .query(`
        INSERT INTO PublicComplaints 
        (ComplainantName, ComplainantAddress, ReferenceNumber, Email, Phone, Fax, 
        ComplaintSource, ComplaintDate, ReceivedDate, ComplaintLocation, Latitude, Longitude,
        AreaType, OfficerName, Zone, Parliament, MonitoringDate, InvestigationReport,
        RootCause, ActionTaken, FollowUpAction)
        VALUES 
        (@complainantName, @complainantAddress, @referenceNumber, @email, @phone, @fax,
        @complaintSource, @complaintDate, @receivedDate, @complaintLocation, @latitude, @longitude,
        @areaType, @officerName, @zone, @parliament, @monitoringDate, @investigationReport,
        @rootCause, @actionTaken, @followUpAction)
      `);

    res.status(200).json({ 
      success: true, 
      message: 'Complaint submitted successfully' 
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error submitting complaint', 
      error: error.message 
    });
  }
}