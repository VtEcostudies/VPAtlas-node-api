const fetch = require('node-fetch')

module.exports = {
    getData,
    getAttachments
  };

/*
https://services1.arcgis.com/d3OaJoSAh2eh6OA9/ArcGIS/rest/services/
service_fae86d23c46e403aa0dae67596be6073
/FeatureServer/
0/1
?f=pjson
*/
function getData(qry) {
  const apiUrl = 'https://services1.arcgis.com/d3OaJoSAh2eh6OA9/ArcGIS/rest/services';
  console.log('vpS123.service::getData | query', qry);
  var srvId = qry.serviceId?qry.serviceId:''; //test: 'service_fae86d23c46e403aa0dae67596be6073'; //VPMonDataSheet1
  var appId = qry.appId?qry.appId:0;
  var objId = qry.objectId?qry.objectId:1;
  var args = 'f=pjson';

  return new Promise((resolve, reject) => {
    if (!srvId) reject({message:'Please provide an S123 serviceId'});
    if (!objId) reject({message:'Please provide an S123 objectId'});
    const url = `${apiUrl}/${srvId}/FeatureServer/${appId}/${objId}?${args}`;
    fetch(url)
      .then(res => res.json()) //this step is necessary when using fetch. without it, result is garbage.
      .then(json => {
        if (json.error) {
          json.error.hint = url;
          json.error.detail = json.error.details;
          console.log('vpS123.service::getData | ERROR', json);
          reject(json.error);
        } else {
          console.log('vpS123.service::getData | SUCCESS', json.feature.attributes);
          resolve(json.feature.attributes);
        }
      })
      .catch(err => {
        console.log('vpS123.service::getData | ERROR', err.message);
        reject(err);
      })
  });
}
/*
https://services1.arcgis.com/d3OaJoSAh2eh6OA9/ArcGIS/rest/services/
service_fae86d23c46e403aa0dae67596be6073/FeatureServer
/0/queryAttachments
?globalIds=8686c8e5-546d-486c-a85f-836554992a64
&returnUrl=true
&f=pjson
&objectIds=
&definitionExpression=
&attachmentsDefinitionExpression=
&attachmentTypes=
&size=
&keywords=
&resultOffset=
&resultRecordCount=
&returnCountOnly=false
&token=
*/
function getAttachments (qry={}) {
  const apiUrl = 'https://services1.arcgis.com/d3OaJoSAh2eh6OA9/ArcGIS/rest/services';
  var srvId = qry.serviceId?qry.serviceId:''; //test: "service_fae86d23c46e403aa0dae67596be6073"; //VPMonDataSheet1
  var appId = qry.appId?qry.appId:0; //S123 services usually have one app with objectId==0
  var objId = qry.objectId?qry.objectId:'';
  var gblId = qry.globalId?qry.globalId:'';//test: "8686c8e5-546d-486c-a85f-836554992a64";
  var args = '&returnUrl=true&f=pjson';

  return new Promise((resolve, reject) => {
    if (!srvId) reject({message:'Please provide an S123 serviceId'});
    if (!objId && !gblId) reject({message:'Please provide an S123 objectId or globalId'});
    const url = `${apiUrl}/${srvId}/FeatureServer/${appId}/queryAttachments?objectIds=${objId}&globalIds=${gblId}&${args}`;
    console.log('vpS123.service::getAttachments | URL', url);
    fetch(url)
      .then(res => res.json()) //this step is necessary when using fetch. without it, result is garbage.
      .then(json => {
        if (json.error) {
          json.error.hint = url;
          json.error.detail = json.error.details;
          console.log('vpS123.service::getAttachments | ERROR', json);
          reject(json.error);
        } else {
          if (json.attachmentGroups.length) { //there are attachments
            console.log('vpS123.service::getAttachments | SUCCESS', json.attachmentGroups);
            resolve(json.attachmentGroups);
          } else {
            console.log('vpS123.service::getAttachments | NOT FOUND', json.attachmentGroups);
            reject({message:`No attachments found for ${gblId?"globalId:"+gblId:"objectId:"+objId}`, hint:url});
          }
        }
      })
      .catch(err => {
        console.log('vpS123.service::getAttachments | ERROR', err.message);
        reject(err);
      })
  });
}
