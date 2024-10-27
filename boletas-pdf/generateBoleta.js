const AWS = require('aws-sdk');
const { PDFDocument, rgb } = require('pdf-lib');

const s3 = new AWS.S3();

module.exports.handler = async (event) => {
  const data = JSON.parse(event.body);
  const { liga, usuario, partido, valorTotal } = data;  

  const { nombre: nombreUsuario, email } = usuario;
  const { equipo1, equipo2, ubicacion } = partido;

  // Crear el PDF
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([500, 700]);

 // Agregar título
page.drawText('Boleta emitida por el grupo 12', { x: 50, y: 640, size: 20, color: rgb(0.1176, 0.5098, 0.7843) }); 

// Resto del contenido
page.drawText(`Liga: ${liga}`, { x: 50, y: 610, size: 15 });
page.drawText(`Usuario: ${nombreUsuario} (${email})`, { x: 50, y: 580, size: 15 });
page.drawText(`Partido: ${equipo1} vs ${equipo2}`, { x: 50, y: 550, size: 15 });
page.drawText(`Ubicación: ${ubicacion}`, { x: 50, y: 520, size: 15 });
page.drawText(`Valor Total: $${valorTotal.toFixed(2)}`, { x: 50, y: 490, size: 15 });


  const pdfBytes = await pdfDoc.save();

  const bucketName = 'imprimir-boletas';
  const fileName = `boletas/${liga}/${nombreUsuario}-${equipo1}-vs-${equipo2}.pdf`;

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




// serverless invoke local -f generateBoleta --data '{"body": "{\"liga\": \"Grupo 12\", \"usuario\": { \"nombre\": \"Juan Perez\", \"email\": \"juan@example.com\" }, \"partido\": {\"equipo1\": \"Equipo A\", \"equipo2\": \"Equipo B\", \"ubicacion\": \"Estadio Principal\"}, \"valorTotal\": 150.00}"}'


//  POST https://hircp5fjud.execute-api.us-east-1.amazonaws.com/dev/generateBoleta
