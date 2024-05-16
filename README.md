Table Ubicaciones {
  Ubicacion_ID varchar [pk]
  No_Empleado varchar
  Latitud varchar 
  Longitud varchar
  Hora time
  Fecha date
}

Table Personal {
  No_Empleado int(6) [pk]
  Nombre varchar
  Telefono varchar (10)
  IMEI varchar
  Clave varchar
  
}


Ref: Personal.No_Empleado < Ubicaciones.No_Empleado// many-to-one

