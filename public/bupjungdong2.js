

function fn_option(code, name){
    return '<option value="' + code +'">' + name +'</option>';
}

function sel_sido(obj){
    $('#gungu').empty().append(fn_option('', '시/군/구')).niceSelect('update')

    let code = $(obj).val();
    let gunguArr = [];
    let gunguCodeArr = [];

    $.ajax({
        type: 'get',
        url: '/bupjungdong.json',
        dataType: 'json',
        success: function(data){
            for(let i in data){
                let sidoCodeNm = data[i].codeNm.toString().substr(0,2);
                let gunguCodeNm = data[i].codeNm.toString().substr(2,3);
                let $gungu = data[i].gungu;
        
                if(code == sidoCodeNm && gunguCodeNm != '000'){
                  gunguArr.push($gungu)
                  gunguCodeArr.push(gunguCodeNm)
                }
              }

              let gunguFilter = [...new Set(gunguArr)];
              let gunguCodeFilter = [...new Set(gunguCodeArr)];

              for(let j in gunguFilter){
                $('#gungu').append(fn_option(gunguCodeFilter[j], gunguFilter[j]))
              }
              $('#gungu').niceSelect('update')
        },
        error: function(req, status, error){
            console.log(req, status, error)
        }
    })


}
