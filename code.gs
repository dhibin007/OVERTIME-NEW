// Replace with your actual Sheet ID
const SHEET_ID = "1LvWFSKCujgRwzr4ZR3JQoJwtycmn9sWx8DD6MST529s"; 

function doGet(e){
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName("Sheet1"); // Sheet containing all data
  var data = sheet.getDataRange().getValues();
  
  var json = [];
  var headers = data[0]; // first row as headers
  
  for(var i=1; i<data.length; i++){
    var row = {};
    for(var j=0; j<headers.length; j++){
      row[headers[j].trim()] = data[i][j];
    }
    json.push(row);
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(json))
    .setMimeType(ContentService.MimeType.JSON);
}

// Optional: Add POST to save data from app to Sheet
function doPost(e){
  const payload = JSON.parse(e.postData.contents);
  const date = payload.date;
  const data = payload.data; // object of employees
  
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("Sheet1");

  // Flatten data for sheet
  Object.values(data).forEach(emp => {
    sheet.appendRow([
      emp.name || "",
      date,
      emp.site || "",
      emp.in || "",
      emp.out || "",
      emp.totalHours || "",
      emp.overtimeHours || ""
    ]);
  });

  return ContentService.createTextOutput(JSON.stringify({status:"success"}))
    .setMimeType(ContentService.MimeType.JSON);
}
