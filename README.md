# BackendFESPE
Table Ubicaciones {
  Ubicacion_ID varchar [pk]
  Personal_ID varchar
  Latitud varchar 
  Longitud varchar
  Hora time
  Fecha date
}

Table Personal {
  Personal_ID varchar [pk]
  Nombre varchar
  Telefono varchar
  IMEI varchar
  Clave varchar
}


Ref: Personal.Personal_ID < Ubicaciones.Personal_ID// many-to-one


