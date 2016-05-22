using Newtonsoft.Json;
using System.Text;

namespace Rendler
{
    internal static class JsonHelper
    {
        public static byte[] Serialize(object obj)
        {
            var str = JsonConvert.SerializeObject(obj);
            return Encoding.UTF8.GetBytes(str);
        }

        public static T Deserialize<T>(byte[] bytes)
        {
            var str = Encoding.UTF8.GetString(bytes);
            return JsonConvert.DeserializeObject<T>(str);
        }
    }
}
