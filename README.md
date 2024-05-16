# BackendFESPE
Table Ubicaciones {
  UbicacionID varchar [pk]
  PersonalID varchar
  Latitud varchar 
  Longitud varchar
  Hora time
  Fecha date
}

Table Personal {
  PersonalID varchar [pk]
  Nombre varchar
  Telefono varchar
  IMEI varchar
  Clave varchar
}
