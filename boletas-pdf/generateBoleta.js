const AWS = require('aws-sdk');
const { PDFDocument } = require('pdf-lib');

const s3 = new AWS.S3();

module.exports.handler = async (event) => {
  const data = JSON.parse(event.body);
  const { grupo, usuario, partido, valorTotal } = data;  

  const { nombre: nombreUsuario, email } = usuario;
  const { equipo1, equipo2, fecha, ubicacion } = partido;

  // Crear el PDF
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([500, 700]);

  page.drawText(`Grupo: ${grupo}`, { x: 50, y: 650, size: 18 });
  page.drawText(`Usuario: ${nombreUsuario} (${email})`, { x: 50, y: 620, size: 15 });
  page.drawText(`Partido: ${equipo1} vs ${equipo2}`, { x: 50, y: 590, size: 15 });
  page.drawText(`Fecha: ${fecha}`, { x: 50, y: 560, size: 15 });
  page.drawText(`Ubicación: ${ubicacion}`, { x: 50, y: 530, size: 15 });
  
  page.drawText(`Valor Total: $${valorTotal.toFixed(2)}`, { x: 50, y: 500, size: 15 }); 

  const pdfBytes = await pdfDoc.save();

  const bucketName = 'imprimir-boletas';
  const fileName = `boletas/${grupo}/${nombreUsuario}-${equipo1}-vs-${equipo2}.pdf`;

  try {
    await s3.putObject({
      Bucket: bucketName,
      Key: fileName,
      Body: Buffer.from(pdfBytes),
      ContentType: 'application/pdf',
    }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Boleta generada y guardada en S3',
        s3Url: `https://${bucketName}.s3.amazonaws.com/${fileName}`
      })
    };
  } catch (error) {
    console.error("Error al guardar la boleta en S3:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error al guardar la boleta en S3' })
    };
  }
};




// serverless invoke local -f generateBoleta --data '{"body": "{\"grupo\": \"Grupo 12\", \"usuario\": { \"nombre\": \"Juan Perez\", \"email\": \"juan@example.com\" }, \"partido\": {\"equipo1\": \"Equipo A\", \"equipo2\": \"Equipo B\", \"fecha\": \"2024-10-26\", \"ubicacion\": \"Estadio Principal\"}, \"valorTotal\": 150.00}"}'


//  https://hircp5fjud.execute-api.us-east-1.amazonaws.com/dev/generateBoleta
