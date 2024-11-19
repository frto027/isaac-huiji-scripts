# frto027 all right reserved
# this file only used for maintenance work of isaac.huijiwiki.com

import json
import mwclient
import mwclient.page

class TabxField:
    TYPE_NUMBER = 'number'
    TYPE_STRING = 'string'
    TYPE_BOOLEAN = 'boolean'

    def __init__(self, data, index):
        self._data = data
        self._index = index

    @property
    def name(self) -> str:
        return self._data["name"]
    
    @property
    def type(self) -> str:
        return self._data["type"]
    
    def title(self, lang:str="en") -> (str | None):
        return self._data["title"][lang] if lang in self._data["title"] else None
    
    def __str__(self) -> str:
        return self._data["name"]
    
class TabxDataRow:
    def __init__(self, row, parentTabx):
        self._row = row
        self._parentTabx = parentTabx

    def __setitem__(self, name, value):
        self.set(name, value)
    def __getitem__(self, name):
        return self.get(name)

    def get(self, fieldName:str):
        field : (TabxField | None) = self._parentTabx.find_field(fieldName)
        if field == None:
            return None
        return self._row[field._index]
    
    def set(self, fieldName:str, value):
        field : (TabxField | None) = self._parentTabx.find_field(fieldName)
        assert field != None, f'field {fieldName} not exists'
        if fieldName in self._parentTabx._columnIndex:
            index = self._parentTabx._columnIndex[fieldName]
            if self._row[field._index] in index and index[self._row[field._index]] == self:
                index[self._row[field._index]] = None
            self._row[field._index] = value
            index[value] = self
        else:
            self._row[field._index] = value

    def set_int(self, fieldName:str, dict:dict[str,str], key_in_str:str, default = None):
        if key_in_str in dict:
            self.set(fieldName, int(dict[key_in_str]))
        else:
            self.set(fieldName, default)
    def set_str(self, fieldName:str, dict:dict[str,str], key_in_str:str, default = None, empty_as_default = False):
        value = default
        if key_in_str in dict:
            if dict[key_in_str] == "" and empty_as_default:
                pass
            else:
                value = dict[key_in_str]
        self.set(fieldName, value)
    
    def dump(self, with_header :bool = True):
        rets = []
        for i in range(len(self._parentTabx._fields)):
            if with_header:
                rets.append(f"{self._parentTabx._fields[i]}:({type(self._row[i])}){self._row[i]}")
            else:
                rets.append(f"{self._row[i]}")
        return ','.join(rets)
class Tabx:
    LICENSE_CC0_1_0 = "CC0-1.0"
    LICENSE_CC_BY_1_0 = "CC-BY-1.0"
    LICENSE_CC_BY_2_0 = "CC-BY-2.0"
    LICENSE_CC_BY_2_5 = "CC-BY-2.5"
    LICENSE_CC_BY_3_0 = "CC-BY-3.0"
    LICENSE_CC_BY_4_0 = "CC-BY-4.0"
    LICENSE_CC_BY_4_0p = "CC-BY-4.0+"
    LICENSE_CC_BY_SA_1_0 = "CC-BY-SA-1.0"
    LICENSE_CC_BY_SA_2_0 = "CC-BY-SA-2.0"
    LICENSE_CC_BY_SA_2_5 = "CC-BY-SA-2.5"
    LICENSE_CC_BY_SA_3_0 = "CC-BY-SA-3.0"
    LICENSE_CC_BY_SA_4_0 = "CC-BY-SA-4.0"
    LICENSE_CC_BY_SA_4_0p = "CC-BY-SA-4.0+"
    LICENSE_ODbL_1_0 = "ODbL-1.0"
    LICENSE_dl_de_zero_2_0 = "dl-de-zero-2.0"
    LICENSE_dl_de_by_1_0 = "dl-de-by-1.0"
    LICENSE_dl_de_by_2_0 = "dl-de-by-2.0"

    def __init__(self, tabx_json_str:str, remove_all_datas = False):
        self._data = json.loads(tabx_json_str)
        self._fields : list[TabxField] = []
        self._fieldsMap : dict[str, TabxField] = dict()
        self._columnIndex : dict[str,dict[str, TabxDataRow]] = {}

        if remove_all_datas:
            self._data["data"] = []
        for i in range(len(self._data["schema"]["fields"])):
            self._fields.append(TabxField(self._data["schema"]["fields"][i], i))
        for f in self._fields:
            self._bind_field(f)

    @property
    def license(self)->str:
        return self._data["license"]
    @license.setter
    def set_license(self, value:str):
        self._data["license"] = value

    def description(self, lang:str = "zh") -> (str | None):
        return self._data["description"][lang] if lang in self._data["description"] else None
    def set_description(self, desc:str, lang:str = "en"):
        self._data["description"][lang] = desc
    
    @property
    def sources(self)->str:
        return self._data["sources"]
    @sources.setter
    def set_source(self, value:str):
        self._data["sources"] = value

    def add_field(self, name:str, title_en:str, type:str=TabxField.TYPE_STRING):
        obj = {
            "name":name,
            "type":type,
            "title":{"en":title_en}
        }
        tabxField = TabxField(obj, len(self._fields))
        self._data["schema"]["fields"].append(obj)
        self._fields.append(tabxField)
        for d in self._data["data"]:
            d.append(None)
        self._bind_field(tabxField)

    def _bind_field(self, field:TabxField):
        assert not field.name in self._fieldsMap
        self._fieldsMap[field.name] = field

    def find_field(self, name:str) -> (TabxField | None):
        return self._fieldsMap[name] if name in self._fieldsMap else None
    
    def data_count(self) -> int:
        return len(self._data["data"])
    def get_data(self, index:int) -> TabxDataRow:
        return TabxDataRow(self._data["data"][index], self)
    def new_data(self) -> TabxDataRow:
        data = [None] * len(self._fields)
        self._data["data"].append(data)
        return TabxDataRow(data, self)
    
    @property
    def datas(self)->list[TabxDataRow]:
        return [TabxDataRow(x, self) for x in self._data["data"]]
    @datas.setter
    def set_datas(self, datas:list[TabxDataRow]):
        self._data["data"] = [x._row for x in datas]

    def fields(self)->list[TabxField]:
        return [x for x in self._fields]
    def dump_fields(self):
        return ','.join([f"({type(x)}){str(x)}" for x in self.fields()])
    
    def get_row_by_unique_field(self, fieldName:str, value, create_ok = False) -> TabxDataRow | None:
        if not fieldName in self._columnIndex:
            idx = {}
            for d in self.datas:
                idx[d.get(fieldName)] = d
            self._columnIndex[fieldName] = idx
        colIndex = self._columnIndex[fieldName]
        if value in colIndex:
            return colIndex[value]
        if create_ok:
            col = self.new_data()
            col.set(fieldName, value)
            return col
        return None
            
    def to_json(self)->str:
        return json.dumps(self._data, ensure_ascii=False)
    
class HuijiTabx(Tabx):
    def __init__(self, page:mwclient.page.Page, create_new :bool = False, remove_all_datas = False):
        if create_new:
            super().__init__("""{
    "description": {"en": "table description"},
    "sources": "Copied from [http://example.com Example Data Source]",
	"license": "CC0-1.0",
    "schema": {
        "fields": [
        ]
    },
    "data": [
    ]
}""")
        else:
            super().__init__(page.text(), remove_all_datas)
        self._page = page

        self.init_json = self.to_json()

    def dump(self, file_name:str = None):
        if file_name == None:
            print(self.to_json())
        else:
            with open(file_name, 'w', encoding='utf8') as f:
                f.write(self.to_json())
                
    def save(self, summary:str = "auto update"):
        self._page.save(self.to_json(), summary = summary)

    def any_changed(self)->bool:
        return self.to_json() != self.init_json
if __name__ == "__main__":
    raise RuntimeError("This file should not be executed")