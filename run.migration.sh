#! /bin/bash

cd db

for FILE in *.sql
  do
    if [[ $FILE == *"_done"* ]];
      then echo "Ignored =========> $FILE"
      else 
        cat $FILE | sudo mysql -u $1 -p $2
        mv $FILE "${FILE%.*}_done.sql"
        echo "Executed =======> $FILE"
    fi
done
